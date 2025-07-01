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

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
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
});