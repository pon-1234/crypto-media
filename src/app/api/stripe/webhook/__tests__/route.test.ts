import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase/admin'
import Stripe from 'stripe'

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
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('POST /api/stripe/webhook', () => {
  const mockEventId = 'evt_test_123'
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
    const mockEvent: Stripe.Event = {
      id: mockEventId,
      type: 'checkout.session.completed',
      created: Date.now(),
      data: {
        object: {
          id: 'cs_test_123',
          mode: 'subscription',
          customer: mockCustomerId,
          subscription: mockSubscriptionId,
          metadata: { userId: mockUserId },
        } as any,
      },
    } as any

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    const mockDoc = {
      exists: false,
      ref: { update: vi.fn() },
    }
    const mockEventRef = {
      get: vi.fn().mockResolvedValue(mockDoc),
      set: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    }
    const mockUserRef = {
      update: vi.fn().mockResolvedValue(null),
    }

    vi.mocked(adminDb.collection).mockImplementation((collection: string) => {
      if (collection === 'webhook_events') {
        return {
          doc: vi.fn(() => mockEventRef),
        } as any
      }
      if (collection === 'users') {
        return {
          doc: vi.fn(() => mockUserRef),
        } as any
      }
      return {} as any
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
    expect(mockEventRef.set).toHaveBeenCalledWith({
      type: 'checkout.session.completed',
      created: mockEvent.created,
      processed_at: expect.any(String),
    })
    expect(mockUserRef.update).toHaveBeenCalledWith({
      stripeCustomerId: mockCustomerId,
      stripeSubscriptionId: mockSubscriptionId,
      membership: 'paid',
      membershipUpdatedAt: expect.any(String),
    })
  })

  it('skips already processed events (idempotency)', async () => {
    const mockEvent: Stripe.Event = {
      id: mockEventId,
      type: 'checkout.session.completed',
      created: Date.now(),
      data: { object: {} as any },
    } as any

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    const mockDoc = {
      exists: true, // Event already processed
    }
    const mockEventRef = {
      get: vi.fn().mockResolvedValue(mockDoc),
      set: vi.fn(),
    }

    vi.mocked(adminDb.collection).mockImplementation(() => ({
      doc: vi.fn(() => mockEventRef),
    }) as any)

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
    const mockEvent: Stripe.Event = {
      id: mockEventId,
      type: 'customer.subscription.deleted',
      created: Date.now(),
      data: {
        object: {
          id: mockSubscriptionId,
        } as any,
      },
    } as any

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

    vi.mocked(adminDb.collection).mockImplementation((collection: string) => {
      if (collection === 'webhook_events') {
        return {
          doc: vi.fn(() => mockEventRef),
        } as any
      }
      if (collection === 'users') {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn().mockResolvedValue(mockSnapshot),
            })),
          })),
        } as any
      }
      return {} as any
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
    })
  })

  it('handles webhook processing errors', async () => {
    const mockEvent: Stripe.Event = {
      id: mockEventId,
      type: 'checkout.session.completed',
      created: Date.now(),
      data: {
        object: {
          mode: 'subscription',
          metadata: { userId: mockUserId },
        } as any,
      },
    } as any

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    const mockEventRef = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: vi.fn().mockRejectedValue(new Error('Database error')),
      delete: vi.fn(),
    }

    vi.mocked(adminDb.collection).mockImplementation(() => ({
      doc: vi.fn(() => mockEventRef),
    }) as any)

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
    expect(data.error).toBe('Webhook processing failed')
    expect(mockEventRef.delete).toHaveBeenCalled()
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