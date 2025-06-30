import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { NextResponse } from 'next/server';

// モックの設定
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/authOptions', () => ({
  authOptions: {},
}));

vi.mock('@/lib/auth/membership', () => ({
  getUserMembership: vi.fn(),
}));

vi.mock('stripe', () => {
  // モック内でエラークラスを定義
  class MockStripeError extends Error {
    statusCode?: number;
    type: string;
    constructor(message: string, statusCode?: number, type: string = 'stripe_error') {
      super(message);
      this.statusCode = statusCode;
      this.type = type;
    }
  }
  
  const mockCreate = vi.fn();
  const MockStripe = vi.fn(() => ({
    billingPortal: {
      sessions: {
        create: mockCreate,
      },
    },
  }));
  
  // Stripe.errors.StripeError をモッククラスに設定
  (MockStripe as unknown as { errors: { StripeError: typeof MockStripeError } }).errors = {
    StripeError: MockStripeError,
  };
  
  return {
    default: MockStripe,
  };
});

// NextResponseのモック
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
    redirect: vi.fn((url) => ({
      status: 307,
      headers: { Location: url },
    })),
  },
}));

import { getServerSession } from 'next-auth';
import { getUserMembership } from '@/lib/auth/membership';
import Stripe from 'stripe';

describe('/api/stripe/portal', () => {
  let mockStripeCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // StripeのcreateメソッドをモックからアクセスできるようにStore
    const stripe = new (Stripe as unknown as new (key: string, options: { apiVersion: string }) => Stripe)('test', { apiVersion: '2025-02-24.acacia' });
    mockStripeCreate = stripe.billingPortal.sessions.create as typeof mockStripeCreate;
    
    // 環境変数のモック
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.co.jp';
  });

  describe('POST', () => {
    it('認証されていない場合、401を返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await POST();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('会員情報が見つからない場合、404を返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123' },
        expires: '2025-08-15',
      });
      vi.mocked(getUserMembership).mockResolvedValue(null);

      const response = await POST();

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'User membership not found' });
    });

    it('StripeカスタマーIDがない場合、400を返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123' },
        expires: '2025-08-15',
      });
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        membership: 'free',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
        paymentStatus: undefined,
      });

      const response = await POST();

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'No Stripe customer found for this user' });
    });

    it('正常にポータルセッションを作成し、リダイレクトする', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user456' },
        expires: '2025-08-15',
      });
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user456',
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });
      mockStripeCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test_123',
      });

      const response = await POST();

      expect(mockStripeCreate).toHaveBeenCalledWith({
        customer: 'cus_123456',
        return_url: 'https://example.co.jp/media/mypage/membership',
      });
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'https://billing.stripe.com/session/test_123'
      );
      expect(response.status).toBe(307);
      expect((response as Response & { headers: { Location: string } }).headers?.Location).toBe('https://billing.stripe.com/session/test_123');
    });

    it('Stripeエラーの場合、適切なエラーレスポンスを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user789' },
        expires: '2025-08-15',
      });
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user789',
        email: 'test@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: 'cus_invalid',
        stripeSubscriptionId: 'sub_invalid',
        paymentStatus: 'active',
      });
      
      // Stripe.errors.StripeErrorと同じ構造のエラーオブジェクトを作成
      const stripeError = Object.assign(new Error('Customer not found'), {
        statusCode: 404,
        type: 'resource_missing',
      }) as Error & { statusCode: number; type: string };
      mockStripeCreate.mockRejectedValue(stripeError);

      const response = await POST();

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({
        error: 'Failed to create portal session',
        message: 'Customer not found',
        type: 'resource_missing',
      });
    });

    it('予期しないエラーの場合、500を返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user999' },
        expires: '2025-08-15',
      });
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user999',
        email: 'test@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });
      mockStripeCreate.mockRejectedValue(new Error('Network error'));

      const response = await POST();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('GET', () => {
    it('POSTと同じ処理を実行する', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123' },
        expires: '2025-08-15',
      });
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });
      mockStripeCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test_456',
      } as Stripe.BillingPortal.Session);

      const response = await GET();

      expect(mockStripeCreate).toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect((response as Response & { headers: { Location: string } }).headers?.Location).toBe('https://billing.stripe.com/session/test_456');
    });
  });
});