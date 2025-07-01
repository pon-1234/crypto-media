/**
 * Stripe SDKクライアントのテスト
 * @doc DEVELOPMENT_GUIDE.md#Stripe決済フロー
 * @related src/lib/stripe/client.ts - テスト対象のStripeクライアント
 * @issue #8 - Stripe CheckoutとWebhookの実装
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';

// Mock Stripe module
vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    customers: {},
    checkout: { sessions: {} },
    webhookEndpoints: {},
  }));
  return { default: MockStripe };
});

/**
 * Stripeクライアントの初期化と設定のテスト
 * - 環境変数の検証
 * - APIバージョンと設定の確認
 */
describe('Stripe Client', () => {
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    console.error = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  it('should initialize Stripe client with correct configuration', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_MONTHLY_PRICE_ID = 'price_123';

    // Dynamically import to test initialization
    return import('./client').then(({ stripe, MONTHLY_PRICE_ID }) => {
      expect(Stripe).toHaveBeenCalledWith('sk_test_123', {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
        maxNetworkRetries: 2,
        timeout: 30000,
      });
      expect(stripe).toBeDefined();
      expect(MONTHLY_PRICE_ID).toBe('price_123');
    });
  });

  it('should handle missing STRIPE_SECRET_KEY gracefully in test environment', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_MONTHLY_PRICE_ID = 'price_123';

    // In test environment, validation is skipped, so it won't throw
    const stripeModule = await import('./client');
    expect(stripeModule.stripe).toBeDefined();
  });

  it('should handle missing STRIPE_MONTHLY_PRICE_ID in test environment', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    delete process.env.STRIPE_MONTHLY_PRICE_ID;

    // In test environment, validation is skipped, but MONTHLY_PRICE_ID will be undefined
    const stripeModule = await import('./client');
    expect(stripeModule.MONTHLY_PRICE_ID).toBeUndefined();
  });

  describe('validateStripeConfig', () => {
    it('should throw error in production for missing environment variables', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_MONTHLY_PRICE_ID;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      
      await expect(import('./client')).rejects.toThrow('Stripe configuration errors:');
    });

    it('should console.error in development for missing environment variables', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_MONTHLY_PRICE_ID;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      
      await import('./client');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stripe configuration errors:')
      );
    });

    it('should throw error for invalid STRIPE_SECRET_KEY format', async () => {
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_SECRET_KEY = 'invalid_key';
      process.env.STRIPE_MONTHLY_PRICE_ID = 'price_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      
      await expect(import('./client')).rejects.toThrow('STRIPE_SECRET_KEY must start with "sk_"');
    });

    it('should throw error for invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format', async () => {
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_MONTHLY_PRICE_ID = 'price_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'invalid_key';
      
      await expect(import('./client')).rejects.toThrow('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with "pk_"');
    });

    it('should pass validation with all valid environment variables', async () => {
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_MONTHLY_PRICE_ID = 'price_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      
      const stripeModule = await import('./client');
      expect(stripeModule.stripe).toBeDefined();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should skip validation entirely in test environment', async () => {
      process.env.NODE_ENV = 'test';
      // No environment variables set
      
      const stripeModule = await import('./client');
      expect(stripeModule.stripe).toBeDefined();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('stripeConfig', () => {
    it('should export stripeConfig with correct values', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_MONTHLY_PRICE_ID = 'price_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      
      const { stripeConfig } = await import('./client');
      
      expect(stripeConfig).toEqual({
        publishableKey: 'pk_test_123',
        monthlyPriceId: 'price_123',
        webhookSecret: 'whsec_123',
        currency: 'jpy',
        locale: 'ja',
      });
    });
  });
});