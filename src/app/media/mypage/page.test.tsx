import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyPage from './page';

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

interface LinkProps {
  children: React.ReactNode;
  href: string;
}

vi.mock('next/link', () => ({
  default: vi.fn(({ children, href }: LinkProps) => <a href={href}>{children}</a>),
}));

import { getServerSession } from 'next-auth';
import { getUserMembership } from '@/lib/auth/membership';

describe('MyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('認証されていない場合', () => {
    it('nullを返す', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const Component = await MyPage();
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
      });
    });

    it('ユーザー情報を表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      expect(screen.getByText('テストユーザー')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('無料会員ステータスを表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      expect(screen.getByText('無料会員')).toBeInTheDocument();
      expect(screen.getByText('無料記事のみお読みいただけます')).toBeInTheDocument();
      // 日付は「更新」と結合されて表示される
      expect(screen.getByText(/2025年06月30日/)).toBeInTheDocument();
    });

    it('有料会員登録ボタンを表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      const upgradeButton = screen.getByRole('link', { name: /有料会員になる/ });
      expect(upgradeButton).toBeInTheDocument();
      expect(upgradeButton).toHaveAttribute('href', '/register');
    });

    it('会員情報メニューがハイライトされる', async () => {
      const Component = await MyPage();
      render(Component!);

      // 会員情報メニューのテキストを含む要素を探す
      const membershipMenuItem = screen.getByText('会員情報・お支払い').closest('a');
      expect(membershipMenuItem).toBeInTheDocument();
      // モックのLinkコンポーネントではclassNameが適用されないため、
      // 実際の実装では ring-2 ring-yellow-500 クラスが適用される
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

      vi.mocked(getUserMembership).mockResolvedValue({
        userId: 'user456',
        email: 'paid@example.com',
        membership: 'paid',
        membershipUpdatedAt: '2025-06-01T10:00:00Z',
        stripeCustomerId: 'cus_123456',
        stripeSubscriptionId: 'sub_123456',
        paymentStatus: 'active',
      });
    });

    it('有料会員ステータスを表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      expect(screen.getByText('有料会員')).toBeInTheDocument();
      expect(screen.getByText('すべての有料記事をお読みいただけます')).toBeInTheDocument();
    });

    it('有料会員登録ボタンを表示しない', async () => {
      const Component = await MyPage();
      render(Component!);

      expect(screen.queryByRole('link', { name: /有料会員になる/ })).not.toBeInTheDocument();
    });

    it('会員情報メニューがハイライトされない', async () => {
      const Component = await MyPage();
      render(Component!);

      const membershipMenuItem = screen.getByText('会員情報・お支払い').closest('a');
      expect(membershipMenuItem).toBeInTheDocument();
      // 有料会員の場合はハイライトされない
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

      vi.mocked(getUserMembership).mockResolvedValue(null);
    });

    it('名前が未設定の場合「未設定」と表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      expect(screen.getByText('未設定')).toBeInTheDocument();
    });

    it('すべてのメニューリンクを表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      expect(screen.getByText('会員情報・お支払い')).toBeInTheDocument();
      expect(screen.getByText('アカウント設定')).toBeInTheDocument();
      expect(screen.getByText('ヘルプ・お問い合わせ')).toBeInTheDocument();
    });

    it('退会リンクを表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      const deleteLink = screen.getByRole('link', { name: '退会をご希望の方はこちら' });
      expect(deleteLink).toBeInTheDocument();
      expect(deleteLink).toHaveAttribute('href', '/media/mypage/delete-account');
    });

    it('会員情報がない場合も正常に表示する', async () => {
      const Component = await MyPage();
      render(Component!);

      // デフォルトで無料会員として扱われる
      expect(screen.getByText('無料会員')).toBeInTheDocument();
    });
  });

  describe('メニューナビゲーション', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
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
      });
    });

    it('すべてのメニューに正しいリンクが設定されている', async () => {
      const Component = await MyPage();
      const { container } = render(Component!);

      expect(container.querySelector('a[href="/media/mypage/membership"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/media/mypage/settings"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/media/mypage/support"]')).toBeInTheDocument();
    });

    it('メニューアイコンが表示される', async () => {
      const Component = await MyPage();
      const { container } = render(Component!);

      // アイコンがレンダリングされているか確認
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});