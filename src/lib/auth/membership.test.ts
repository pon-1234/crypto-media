import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserMembership, isPaidMember, hasAccess } from './membership';

// Mockの設定
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/authOptions', () => ({
  authOptions: {},
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
  },
}));

import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';

describe('membership.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserMembership', () => {
    it('未認証ユーザーの場合、nullを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await getUserMembership();
      expect(result).toBeNull();
    });

    it('セッションにuser.idがない場合、nullを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const result = await getUserMembership();
      expect(result).toBeNull();
    });

    it('ユーザーDocumentが存在しない場合、nullを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await getUserMembership();
      expect(result).toBeNull();
    });

    it('無料会員の情報を正しく返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockUserData = {
        email: 'test@example.com',
        membership: 'free',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
      };

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await getUserMembership();
      expect(result).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        membership: 'free',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
        paymentStatus: undefined,
      });
    });

    it('有料会員の情報を正しく返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user456', email: 'paid@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockUserData = {
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      };

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await getUserMembership();
      expect(result).toEqual({
        userId: 'user456',
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });
    });

    it('エラーが発生した場合、nullを返す', async () => {
      vi.mocked(getServerSession).mockRejectedValue(new Error('Auth error'));

      const result = await getUserMembership();
      expect(result).toBeNull();
    });

    it('membershipフィールドが存在しない場合、デフォルトでfreeを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user789', email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockUserData = {
        email: 'test@example.com',
        // membershipフィールドなし
      };

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await getUserMembership();
      expect(result?.membership).toBe('free');
    });
  });

  describe('isPaidMember', () => {
    it('有料会員の場合、trueを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ membership: 'paid' }),
      });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await isPaidMember();
      expect(result).toBe(true);
    });

    it('無料会員の場合、falseを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ membership: 'free' }),
      });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await isPaidMember();
      expect(result).toBe(false);
    });

    it('未認証の場合、falseを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await isPaidMember();
      expect(result).toBe(false);
    });
  });

  describe('hasAccess', () => {
    it('publicコンテンツの場合、常にtrueを返す', async () => {
      // authをモックしない（呼ばれないことを確認）
      const result = await hasAccess('public');
      expect(result).toBe(true);
      expect(getServerSession).not.toHaveBeenCalled();
    });

    it('paidコンテンツで有料会員の場合、trueを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ membership: 'paid' }),
      });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await hasAccess('paid');
      expect(result).toBe(true);
    });

    it('paidコンテンツで無料会員の場合、falseを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
        expires: '2025-08-15',
      } as any);

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ membership: 'free' }),
      });
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      } as any);

      const result = await hasAccess('paid');
      expect(result).toBe(false);
    });

    it('paidコンテンツで未認証の場合、falseを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await hasAccess('paid');
      expect(result).toBe(false);
    });
  });
});