import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase/admin'
import { sendEmail } from '@/lib/email/sendgrid'
import * as webhookSecurity from '@/lib/stripe/webhook-security'
import Stripe from 'stripe'

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(),
    runTransaction: vi.fn(),
  },
}))

vi.mock('@/lib/email/sendgrid', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/stripe/webhook-security', () => ({
  isStripeIp: vi.fn(),
  logWebhookEvent: vi.fn(),
  WebhookTimer: class {
    logDuration = vi.fn()
  },
}))

describe('Stripe Webhook - invoice.payment_failed', () => {
  const mockEvent = {
    id: 'evt_test_123',
    type: 'invoice.payment_failed',
    created: 1234567890,
    livemode: false,
    data: {
      object: {
        id: 'in_test_123',
        subscription: 'sub_test_123',
        customer: 'cus_test_123',
        amount_due: 1980,
        currency: 'jpy',
        attempt_count: 2,
      } as unknown as Stripe.Invoice,
    },
  } as Stripe.Event

  let mockAddPaymentFailure: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    // NODE_ENVは読み取り専用なので設定しない
    
    // isStripeIpをtrueを返すようにモック
    ;(webhookSecurity.isStripeIp as Mock).mockReturnValue(true)
    
    mockAddPaymentFailure = vi.fn().mockResolvedValue({})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('支払い失敗時にメール通知を送信する', async () => {
    const mockRequest = {
      text: vi.fn().mockResolvedValue(JSON.stringify(mockEvent)),
      headers: {
        get: vi.fn((header) => {
          if (header === 'stripe-signature') return 'test-signature'
          return null
        }),
      },
    } as unknown as NextRequest

    // Stripe署名検証のモック
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    // イベントの冪等性チェックのモック
    const mockEventDoc = {
      exists: false,
    }
    const mockTransaction = {
      get: vi.fn().mockResolvedValue(mockEventDoc),
      set: vi.fn(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(adminDb.runTransaction).mockImplementation(async (fn: any) => {
      return fn(mockTransaction)
    })

    // ユーザー検索のモック
    const mockUserSnapshot = {
      empty: false,
      docs: [{
        data: () => ({
          email: 'test@example.com',
          stripeCustomerId: 'cus_test_123',
        }),
      }],
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(adminDb.collection).mockImplementation((collection: string): any => {
      if (collection === 'users') {
        return {
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue(mockUserSnapshot),
        }
      } else if (collection === 'payment_failures') {
        return {
          add: mockAddPaymentFailure,
        }
      } else if (collection === 'webhook_events') {
        return {
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue(mockEventDoc),
            set: vi.fn(),
            delete: vi.fn(),
          })),
        }
      }
      return {}
    })

    const response = await POST(mockRequest)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ received: true })

    // メール送信が呼ばれたことを確認
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'お支払いに関する重要なお知らせ',
      text: expect.stringContaining('お客様のサブスクリプションのお支払い処理に失敗しました'),
      html: expect.stringContaining('お支払いに関する重要なお知らせ'),
    })

    // 支払い失敗記録が作成されたことを確認
    expect(mockAddPaymentFailure).toHaveBeenCalledWith({
      subscriptionId: 'sub_test_123',
      customerId: 'cus_test_123',
      invoiceId: 'in_test_123',
      amount: 1980,
      currency: 'jpy',
      failedAt: expect.any(String),
      attemptCount: 2,
    })
  })

  it('ユーザーが見つからない場合はメールを送信しない', async () => {
    const mockRequest = {
      text: vi.fn().mockResolvedValue(JSON.stringify(mockEvent)),
      headers: {
        get: vi.fn((header) => {
          if (header === 'stripe-signature') return 'test-signature'
          return null
        }),
      },
    } as unknown as NextRequest

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    // イベントの冪等性チェックのモック
    const mockEventDoc = { exists: false }
    const mockTransaction = {
      get: vi.fn().mockResolvedValue(mockEventDoc),
      set: vi.fn(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(adminDb.runTransaction).mockImplementation(async (fn: any) => {
      return fn(mockTransaction)
    })

    // ユーザーが見つからないケース
    const mockEmptyUserSnapshot = {
      empty: true,
      docs: [],
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(adminDb.collection).mockImplementation((collection: string): any => {
      if (collection === 'users') {
        return {
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue(mockEmptyUserSnapshot),
        }
      } else if (collection === 'payment_failures') {
        return {
          add: mockAddPaymentFailure,
        }
      } else if (collection === 'webhook_events') {
        return {
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue(mockEventDoc),
            set: vi.fn(),
            delete: vi.fn(),
          })),
        }
      }
      return {}
    })

    const response = await POST(mockRequest)

    expect(response.status).toBe(200)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('メール送信に失敗してもWebhook処理は成功する', async () => {
    const mockRequest = {
      text: vi.fn().mockResolvedValue(JSON.stringify(mockEvent)),
      headers: {
        get: vi.fn((header) => {
          if (header === 'stripe-signature') return 'test-signature'
          return null
        }),
      },
    } as unknown as NextRequest

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)

    // イベントの冪等性チェックのモック
    const mockEventDoc = { exists: false }
    const mockTransaction = {
      get: vi.fn().mockResolvedValue(mockEventDoc),
      set: vi.fn(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(adminDb.runTransaction).mockImplementation(async (fn: any) => {
      return fn(mockTransaction)
    })

    // ユーザー検索のモック
    const mockUserSnapshot = {
      empty: false,
      docs: [{
        data: () => ({
          email: 'test@example.com',
          stripeCustomerId: 'cus_test_123',
        }),
      }],
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(adminDb.collection).mockImplementation((collection: string): any => {
      if (collection === 'users') {
        return {
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue(mockUserSnapshot),
        }
      } else if (collection === 'payment_failures') {
        return {
          add: mockAddPaymentFailure,
        }
      } else if (collection === 'webhook_events') {
        return {
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue(mockEventDoc),
            set: vi.fn(),
            delete: vi.fn(),
          })),
        }
      }
      return {}
    })

    // メール送信をエラーにする
    vi.mocked(sendEmail).mockRejectedValue(new Error('SendGrid error'))

    const response = await POST(mockRequest)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ received: true })
    expect(sendEmail).toHaveBeenCalled()
  })
})