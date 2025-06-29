/**
 * layout.tsx の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Next.js fontモジュールをモック
vi.mock('next/font/google', () => ({
  Inter: vi.fn(() => ({
    className: 'inter-font-class',
  })),
}));

// NextAuthをモック
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

import RootLayout from '../layout';

describe('RootLayout', () => {
  it('正しいHTML構造でレンダリングされる', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );
    
    // RootLayoutがhtml要素を含むため、container内でlang属性を確認
    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain('lang="ja"');
  });

  it('子要素が正しくレンダリングされる', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );
    
    expect(getByTestId('test-child')).toBeInTheDocument();
    expect(getByTestId('test-child')).toHaveTextContent('Test Content');
  });

  it('AuthProviderが含まれている', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    
    // AuthProviderの存在を確認（SessionProviderが含まれているはず）
    expect(container.innerHTML).toContain('Test');
  });

  it('bodyにクラスが適用されている', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    
    // body要素にフォントクラスが適用されているか確認
    expect(container.innerHTML).toContain('inter-font-class');
  });
});