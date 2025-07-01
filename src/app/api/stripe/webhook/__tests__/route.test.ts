/**
 * Stripe Webhookエンドポイントのテスト
 * @doc DEVELOPMENT_GUIDE.md#Stripe決済フロー
 * @related src/app/api/stripe/webhook/route.ts - テスト対象のWebhookルート
 * @issue #8 - Stripe CheckoutとWebhookの実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase/admin'
import { createMockStripeEvent, createMockCheckoutSession, createMockSubscription } from '@/test/factories/stripe'
import {
  createMockCollection,
  createMockDocumentSnapshot,
  createMockDocumentReference,
  createMockTransaction,
} from '@/test/factories/firebase'

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(),
    runTransaction: vi.fn(),
  },
}))

describe('POST /api/stripe/webhook', () => {
  const mockUserId = 'user123'
  const mockCustomerId = 'cus_test_123'
  const mockSubscriptionId = 'sub_test_123'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing stripe-signature header')
  })

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid_signature',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid signature')
  })

  it('handles checkout.session.completed event', async () => {
    const mockEvent = createMockStripeEvent(
      'checkout.session.completed',
      createMockCheckoutSession({
        id: 'cs_test_123',
        mode: 'subscription',
        customer: mockCustomerId,
        subscription: mockSubscriptionId,
        metadata: { userId: mockUserId },
      })
    )

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    const mockDoc = createMockDocumentSnapshot(false)
    const mockEventRef = {
      get: vi.fn().mockResolvedValue(mockDoc),
      set: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    }
    const mockUserRef = {
      update: vi.fn().mockResolvedValue(null),
    }

    // トランザクションのモックを設定（2回呼ばれる: 1回目はイベントの重複チェック、2回目はユーザー更新）
    let transactionCallCount = 0
    vi.mocked(adminDb.runTransaction).mockImplementation(async (updateFunction) => {
      transactionCallCount++
      if (transactionCallCount === 1) {
        // イベントの重複チェック用トランザクション
        const mockTransaction = createMockTransaction()
        const mockGet = mockTransaction.get as unknown as ReturnType<typeof vi.fn<() => Promise<unknown>>>
        mockGet.mockImplementation(() => Promise.resolve(mockDoc))
        return await updateFunction(mockTransaction)
      } else {
        // ユーザー更新用トランザクション
        const mockUserDoc = createMockDocumentSnapshot(true, { membership: 'free' })
        const mockTransaction = createMockTransaction()
        const mockGet = mockTransaction.get as unknown as ReturnType<typeof vi.fn<() => Promise<unknown>>>
        mockGet.mockImplementation(() => Promise.resolve(mockUserDoc))
        return await updateFunction(mockTransaction)
      }
    })

    vi.mocked(adminDb.collection).mockImplementation((collection: string) => {
      const mockCollection = createMockCollection()
      if (collection === 'webhook_events') {
        vi.mocked(mockCollection.doc).mockReturnValue(mockEventRef as unknown as ReturnType<typeof mockCollection.doc>)
      } else if (collection === 'users') {
        vi.mocked(mockCollection.doc).mockReturnValue(mockUserRef as unknown as ReturnType<typeof mockCollection.doc>)
      }
      return mockCollection as unknown as ReturnType<typeof adminDb.collection>
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    // トランザクション内でのset呼び出しを確認
    expect(vi.mocked(adminDb.runTransaction)).toHaveBeenCalledTimes(2)
    // ユーザー更新は直接mockUserRef.updateを確認する必要がない（トランザクション内で処理される）
  })

  it('skips already processed events (idempotency)', async () => {
    const mockEvent = createMockStripeEvent(
      'checkout.session.completed',
      createMockCheckoutSession()
    )

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    const mockDoc = createMockDocumentSnapshot(true) // Event already processed
    const mockEventRef = {
      get: vi.fn().mockResolvedValue(mockDoc),
      set: vi.fn(),
    }

    // トランザクションのモックを設定（既に処理済みの場合）
    vi.mocked(adminDb.runTransaction).mockImplementation(async (updateFunction) => {
      const mockTransaction = createMockTransaction()
      const mockGet = mockTransaction.get as unknown as ReturnType<typeof vi.fn<() => Promise<unknown>>>
      mockGet.mockImplementation(() => Promise.resolve(mockDoc))
      return await updateFunction(mockTransaction)
    })

    const mockColl2 = createMockCollection()
    vi.mocked(mockColl2.doc).mockReturnValue(mockEventRef as unknown as ReturnType<typeof mockColl2.doc>)
    vi.mocked(adminDb.collection).mockReturnValue(mockColl2 as unknown as ReturnType<typeof adminDb.collection>)

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockEventRef.set).not.toHaveBeenCalled()
  })

  it('handles customer.subscription.deleted event', async () => {
    const mockEvent = createMockStripeEvent(
      'customer.subscription.deleted',
      createMockSubscription({
        id: mockSubscriptionId,
      })
    )

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    const mockUserDoc = {
      ref: {
        update: vi.fn().mockResolvedValue(null),
      },
    }
    const mockSnapshot = {
      empty: false,
      docs: [mockUserDoc],
    }

    const mockEventRef = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    }

    // トランザクションのモックを設定
    vi.mocked(adminDb.runTransaction).mockImplementation(async (updateFunction) => {
      const mockTransaction = createMockTransaction()
      const mockDocSnapshot = createMockDocumentSnapshot(false)
      const mockGet = mockTransaction.get as unknown as ReturnType<typeof vi.fn<() => Promise<unknown>>>
      mockGet.mockImplementation(() => Promise.resolve(mockDocSnapshot))
      return await updateFunction(mockTransaction)
    })

    vi.mocked(adminDb.collection).mockImplementation((collection: string) => {
      const mockColl = createMockCollection()
      if (collection === 'webhook_events') {
        vi.mocked(mockColl.doc).mockReturnValue(mockEventRef as unknown as ReturnType<typeof mockColl.doc>)
      } else if (collection === 'users') {
        vi.mocked(mockColl.where).mockReturnValue({
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue(mockSnapshot),
          })),
        } as unknown as ReturnType<typeof mockColl.where>)
      }
      return mockColl as unknown as ReturnType<typeof adminDb.collection>
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockUserDoc.ref.update).toHaveBeenCalledWith({
      membership: 'free',
      membershipUpdatedAt: expect.any(String),
      stripeSubscriptionId: null,
      paymentStatus: 'canceled',
    })
  })

  it('handles webhook processing errors', async () => {
    const mockEvent = createMockStripeEvent(
      'checkout.session.completed',
      createMockCheckoutSession({
        mode: 'subscription',
        metadata: { userId: mockUserId },
      })
    )

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    const mockEventRef = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: vi.fn().mockRejectedValue(new Error('Database error')),
      delete: vi.fn(),
    }

    // トランザクションのモックを設定（イベントチェックでエラーを発生させる）
    vi.mocked(adminDb.runTransaction).mockRejectedValue(new Error('Database error'))

    const mockColl4 = createMockCollection()
    vi.mocked(mockColl4.doc).mockReturnValue(mockEventRef as unknown as ReturnType<typeof mockColl4.doc>)
    vi.mocked(adminDb.collection).mockReturnValue(mockColl4 as unknown as ReturnType<typeof adminDb.collection>)

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
    // トランザクションでエラーが発生した場合、deleteは呼ばれない
    expect(mockEventRef.delete).not.toHaveBeenCalled()
  })

  it('returns 500 when webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Webhook secret not configured')
  })
})