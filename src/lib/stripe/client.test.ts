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
      });
      expect(stripe).toBeDefined();
      expect(MONTHLY_PRICE_ID).toBe('price_123');
    });
  });

  it('should throw error when STRIPE_SECRET_KEY is not defined', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_MONTHLY_PRICE_ID = 'price_123';

    await expect(() => import('./client')).rejects.toThrow(
      'STRIPE_SECRET_KEY is not defined in environment variables'
    );
  });

  it('should warn when STRIPE_MONTHLY_PRICE_ID is not defined', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    delete process.env.STRIPE_MONTHLY_PRICE_ID;

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    return import('./client').then(({ MONTHLY_PRICE_ID }) => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'STRIPE_MONTHLY_PRICE_ID is not defined. Checkout sessions will not work properly.'
      );
      expect(MONTHLY_PRICE_ID).toBe('');
      consoleWarnSpy.mockRestore();
    });
  });
});