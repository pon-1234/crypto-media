import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MembershipPage from './page';

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

vi.mock('next/link', () => ({
  default: vi.fn(({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>),
}));

import { getServerSession } from 'next-auth';
import { getUserMembership } from '@/lib/auth/membership';
import type { Membership } from '@/lib/auth/membership';

describe('MembershipPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('認証されていない場合', () => {
    it('nullを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const Component = await MembershipPage();
      expect(Component).toBeNull();
    });
  });

  describe('無料会員の場合', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'テストユーザー',
        },
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
      } as Membership & { stripeCustomerId: undefined; stripeSubscriptionId: undefined; paymentStatus: undefined });
    });

    it('無料会員プランを表示する', async () => {
      const Component = await MembershipPage();
      render(Component!);

      expect(screen.getByText('無料会員')).toBeInTheDocument();
      expect(screen.getByText('無料記事のみ閲覧可能')).toBeInTheDocument();
    });

    it('有料会員の特典を表示する', async () => {
      const Component = await MembershipPage();
      render(Component!);

      expect(screen.getByText('有料会員になると以下の特典があります：')).toBeInTheDocument();
      expect(screen.getByText('• すべての有料記事が読み放題')).toBeInTheDocument();
      expect(screen.getByText('• 専門家による深い分析・調査レポート')).toBeInTheDocument();
      expect(screen.getByText('• 最新の暗号資産・ブロックチェーン情報')).toBeInTheDocument();
    });

    it('有料会員登録ボタンを表示する', async () => {
      const Component = await MembershipPage();
      render(Component!);

      const upgradeButton = screen.getByRole('link', { name: /有料会員になる（月額1,980円）/ });
      expect(upgradeButton).toBeInTheDocument();
      expect(upgradeButton).toHaveAttribute('href', '/register');
    });

    it('契約情報管理セクションを表示しない', async () => {
      const Component = await MembershipPage();
      render(Component!);

      expect(screen.queryByText('契約情報管理')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /契約情報を管理する/ })).not.toBeInTheDocument();
    });
  });

  describe('有料会員の場合', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user456',
          email: 'paid@example.com',
          name: '有料会員ユーザー',
        },
        expires: '2025-08-15',
      });
    });

    it('有料会員プランを表示する（支払い正常）', async () => {
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user456',
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-01T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });

      const Component = await MembershipPage();
      render(Component!);

      expect(screen.getByText('有料会員プラン')).toBeInTheDocument();
      expect(screen.getByText('月額 1,980円（税込）')).toBeInTheDocument();
      expect(screen.getByText('正常')).toBeInTheDocument();
      expect(screen.getByText('お支払いは正常に処理されています')).toBeInTheDocument();
    });

    it('支払い遅延ステータスを表示する', async () => {
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user456',
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-01T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'past_due',
      });

      const Component = await MembershipPage();
      render(Component!);

      expect(screen.getByText('支払い遅延')).toBeInTheDocument();
      expect(screen.getByText('お支払いの確認が必要です')).toBeInTheDocument();
    });

    it('契約情報管理ボタンを表示する', async () => {
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user456',
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-01T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });

      const Component = await MembershipPage();
      render(Component!);

      const portalButton = screen.getByRole('button', { name: /契約情報を管理する/ });
      expect(portalButton).toBeInTheDocument();
      
      // フォームのaction属性を確認
      const form = portalButton.closest('form');
      expect(form).toHaveAttribute('action', '/api/stripe/portal');
      expect(form).toHaveAttribute('method', 'POST');
    });

    it('有料会員登録ボタンを表示しない', async () => {
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user456',
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-01T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });

      const Component = await MembershipPage();
      render(Component!);

      expect(screen.queryByRole('link', { name: /有料会員になる/ })).not.toBeInTheDocument();
    });
  });

  describe('共通機能', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user789',
          email: 'user@example.com',
        },
        expires: '2025-08-15',
      });

      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user789',
        email: 'user@example.com',
        membership: 'free',
        membershipUpdatedAt: '2025-06-30T10:00:00Z',
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
        paymentStatus: undefined,
      });
    });

    it('マイページへの戻るリンクを表示する', async () => {
      const Component = await MembershipPage();
      render(Component!);

      const backLink = screen.getByRole('link', { name: /マイページに戻る/ });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/media/mypage');
    });

    it('注意事項を表示する', async () => {
      const Component = await MembershipPage();
      render(Component!);

      expect(screen.getByText('ご注意事項')).toBeInTheDocument();
      expect(screen.getByText(/サブスクリプションは自動更新されます/)).toBeInTheDocument();
      expect(screen.getByText(/キャンセル後も、現在の請求期間の終了日まで/)).toBeInTheDocument();
    });

    it('サポートへのリンクを含む', async () => {
      const Component = await MembershipPage();
      render(Component!);

      const supportLink = screen.getByRole('link', { name: 'サポート' });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', '/media/mypage/support');
    });
  });

  describe('支払いステータスの表示', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
        expires: '2025-08-15',
      });
    });

    it('キャンセル済みステータスを表示する', async () => {
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-01T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: undefined,
        paymentStatus: 'canceled',
      });

      const Component = await MembershipPage();
      render(Component!);

      expect(screen.getByText('キャンセル済み')).toBeInTheDocument();
      expect(screen.getByText('サブスクリプションはキャンセルされました')).toBeInTheDocument();
    });

    it('未払いステータスを表示する', async () => {
      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-01T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: undefined,
        paymentStatus: 'unpaid',
      });

      const Component = await MembershipPage();
      render(Component!);

      expect(screen.getByText('未払い')).toBeInTheDocument();
      expect(screen.getByText('お支払いが確認できません')).toBeInTheDocument();
    });
  });
});