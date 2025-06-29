/**
 * media/page.tsx の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MediaHome from '../page';

describe('MediaHome', () => {
  it('メディアサイトのタイトルが表示される', () => {
    render(<MediaHome />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Crypto Media');
  });

  it('説明文が表示される', () => {
    render(<MediaHome />);
    
    const description = screen.getByText('暗号資産・ブロックチェーンに関する最新情報をお届けします');
    expect(description).toBeInTheDocument();
  });

  it('適切なスタイルクラスが適用されている', () => {
    const { container } = render(<MediaHome />);
    
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('min-h-screen', 'p-8');
  });
});