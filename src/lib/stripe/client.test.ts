/**
 * Stripe SDKクライアントのテスト
 * @doc DEVELOPMENT_GUIDE.md#Stripe決済フロー
 * @related src/lib/stripe/client.ts - テスト対象のStripeクライアント
 * @issue #8 - Stripe CheckoutとWebhookの実装
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Stripe from 'stripe'

// Mock Stripe module
vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    customers: {},
    checkout: { sessions: {} },
    webhookEndpoints: {},
  }))
  return { default: MockStripe }
})

// Mock environment detection
vi.mock('@/lib/env/detect', () => ({
  isTestOrCI: vi.fn(() => true), // デフォルトはテスト環境
}))

/**
 * Stripeクライアントの初期化と設定のテスト
 * - 環境変数の検証
 * - APIバージョンと設定の確認
 */
describe('Stripe Client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'test')
    console.error = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('should initialize Stripe client with correct configuration', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_123')

    // Dynamically import to test initialization
    return import('./client').then(({ stripe, MONTHLY_PRICE_ID }) => {
      expect(Stripe).toHaveBeenCalledWith('sk_test_123', {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
        maxNetworkRetries: 2,
        timeout: 30000,
      })
      expect(stripe).toBeDefined()
      expect(MONTHLY_PRICE_ID).toBe('price_123')
    })
  })

  it('should handle missing STRIPE_SECRET_KEY gracefully in test environment', async () => {
    vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_123')

    // In test environment, validation is skipped, so it won't throw
    const stripeModule = await import('./client')
    expect(stripeModule.stripe).toBeDefined()
  })

  it('should handle missing STRIPE_MONTHLY_PRICE_ID in test environment', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')

    // In test environment, validation is skipped, but MONTHLY_PRICE_ID will be undefined
    const stripeModule = await import('./client')
    expect(stripeModule.MONTHLY_PRICE_ID).toBeUndefined()
  })

  describe('validateStripeConfig', () => {
    it('should throw error in production for missing environment variables', async () => {
      // isTestOrCIをfalseにして本番環境をシミュレート
      const { isTestOrCI } = await import('@/lib/env/detect')
      vi.mocked(isTestOrCI).mockReturnValue(false)
      
      vi.stubEnv('NODE_ENV', 'production')

      await expect(import('./client')).rejects.toThrow(
        'Stripe configuration errors:'
      )
    })

    it('should console.error in development for missing environment variables', async () => {
      // isTestOrCIをfalseにして開発環境をシミュレート
      const { isTestOrCI } = await import('@/lib/env/detect')
      vi.mocked(isTestOrCI).mockReturnValue(false)
      
      vi.stubEnv('NODE_ENV', 'development')
      // 有効な形式のダミーキーを設定して形式チェックエラーを回避
      vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_dummy')
      vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_dummy')

      await import('./client')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stripe configuration errors:')
      )
    })

    it('should throw error for invalid STRIPE_SECRET_KEY format', async () => {
      // isTestOrCIをfalseにして形式チェックを有効化
      const { isTestOrCI } = await import('@/lib/env/detect')
      vi.mocked(isTestOrCI).mockReturnValue(false)
      
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('STRIPE_SECRET_KEY', 'invalid_key')
      vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_123')
      vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_123')
      vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_123')

      await expect(import('./client')).rejects.toThrow(
        'STRIPE_SECRET_KEY must start with "sk_"'
      )
    })

    it('should throw error for invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format', async () => {
      // isTestOrCIをfalseにして形式チェックを有効化
      const { isTestOrCI } = await import('@/lib/env/detect')
      vi.mocked(isTestOrCI).mockReturnValue(false)
      
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
      vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_123')
      vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_123')
      vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'invalid_key')

      await expect(import('./client')).rejects.toThrow(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with "pk_"'
      )
    })

    it('should pass validation with all valid environment variables', async () => {
      // isTestOrCIをfalseにしてバリデーションを実行
      const { isTestOrCI } = await import('@/lib/env/detect')
      vi.mocked(isTestOrCI).mockReturnValue(false)
      
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
      vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_123')
      vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_123')
      vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_123')

      const stripeModule = await import('./client')
      expect(stripeModule.stripe).toBeDefined()
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should skip validation entirely in test environment', async () => {
      // isTestOrCIをtrueにしてテスト環境をシミュレート
      const { isTestOrCI } = await import('@/lib/env/detect')
      vi.mocked(isTestOrCI).mockReturnValue(true)
      
      vi.stubEnv('NODE_ENV', 'test')
      // No environment variables set

      const stripeModule = await import('./client')
      expect(stripeModule.stripe).toBeDefined()
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('stripeConfig', () => {
    it('should export stripeConfig with correct values', async () => {
      vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
      vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_123')
      vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_123')
      vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_123')

      const { stripeConfig } = await import('./client')

      expect(stripeConfig).toEqual({
        publishableKey: 'pk_test_123',
        monthlyPriceId: 'price_123',
        webhookSecret: 'whsec_123',
        currency: 'jpy',
        locale: 'ja',
      })
    })
  })
})
