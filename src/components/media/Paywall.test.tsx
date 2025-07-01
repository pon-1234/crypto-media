/**
 * ペイウォールコンポーネントのテスト
 * @doc DEVELOPMENT_GUIDE.md#ペイウォール
 * @related src/components/media/Paywall.tsx - テスト対象のペイウォールコンポーネント
 * @issue #6 - 有料記事のペイウォール実装
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Paywall } from './Paywall';

/**
 * ペイウォールコンポーネントの表示と機能のテスト
 * - 記事タイトルとプレビューの表示
 * - 有料会員登録へのCTA
 * - HTMLとテキストプレビューの切り替え
 */
describe('Paywall', () => {
  const defaultProps = {
    title: 'テスト記事のタイトル',
    preview: '<p>これはプレビューコンテンツです。</p>',
  };

  it('記事タイトルを表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('テスト記事のタイトル');
  });

  it('HTMLプレビューコンテンツを表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    const previewElement = screen.getByText('これはプレビューコンテンツです。');
    expect(previewElement).toBeInTheDocument();
  });

  it('テキストプレビューコンテンツを表示する', () => {
    render(
      <Paywall 
        title="テスト記事" 
        preview="これはテキストプレビューです。" 
        isHtml={false} 
      />
    );
    
    expect(screen.getByText('これはテキストプレビューです。')).toBeInTheDocument();
  });

  it('ペイウォールのメッセージを表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    expect(screen.getByText('この記事は有料会員限定です')).toBeInTheDocument();
    expect(screen.getByText(/この記事の続きを読むには/)).toBeInTheDocument();
    expect(screen.getByText(/月額1,980円/)).toBeInTheDocument();
  });

  it('有料会員登録ボタンを表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    const registerButton = screen.getByRole('link', { name: '有料会員登録する' });
    expect(registerButton).toBeInTheDocument();
    expect(registerButton).toHaveAttribute('href', '/register');
  });

  it('ログインボタンを表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    const loginButton = screen.getByRole('link', { name: 'ログインする' });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute('href', '/login');
  });

  it('有料会員の特典を表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    expect(screen.getByText('有料会員の特典')).toBeInTheDocument();
    expect(screen.getByText('すべての有料記事が読み放題')).toBeInTheDocument();
    expect(screen.getByText('専門家による深い分析・調査レポート')).toBeInTheDocument();
    expect(screen.getByText('最新の暗号資産・ブロックチェーン情報')).toBeInTheDocument();
    expect(screen.getByText('いつでも解約可能')).toBeInTheDocument();
  });

  it('ロックアイコンを表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    // Lucide Reactのアイコンは通常SVGとしてレンダリングされる
    const lockIcon = document.querySelector('svg');
    expect(lockIcon).toBeInTheDocument();
  });

  it('既存会員向けのメッセージを表示する', () => {
    render(<Paywall {...defaultProps} />);
    
    expect(screen.getByText('※ すでに有料会員の方は、ログインしてください')).toBeInTheDocument();
  });

  it('正しいCSSクラスが適用されている', () => {
    const { container } = render(<Paywall {...defaultProps} />);
    
    // ペイウォールセクション
    const paywallSection = container.querySelector('.rounded-lg.border-2.border-gray-200.bg-gray-50');
    expect(paywallSection).toBeInTheDocument();
    
    // 特典セクション
    const benefitsSection = container.querySelector('.rounded-lg.bg-blue-50');
    expect(benefitsSection).toBeInTheDocument();
  });

  it('HTMLコンテンツが安全にレンダリングされる', () => {
    const dangerousHtml = '<script>alert("XSS")</script><p>安全なコンテンツ</p>';
    render(<Paywall title="テスト" preview={dangerousHtml} />);
    
    // スクリプトタグは実行されずに、安全なコンテンツのみが表示される
    expect(screen.getByText('安全なコンテンツ')).toBeInTheDocument();
    expect(screen.queryByText('alert("XSS")')).not.toBeInTheDocument();
  });

  it('レスポンシブデザインが適用されている', () => {
    const { container } = render(<Paywall {...defaultProps} />);
    
    // ボタンコンテナのレスポンシブクラス
    const buttonContainer = container.querySelector('.flex.flex-col.gap-4.sm\\:flex-row.sm\\:justify-center');
    expect(buttonContainer).toBeInTheDocument();
    
    // タイトルのレスポンシブクラス
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('text-3xl', 'sm:text-4xl');
  });
});