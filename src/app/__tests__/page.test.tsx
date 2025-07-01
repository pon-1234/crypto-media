/**
 * page.tsx の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home', () => {
  it('ホームページのタイトルが表示される', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Crypto Media & Corporate Site')
  })

  it('説明文が表示される', () => {
    render(<Home />)

    const description = screen.getByText(
      'SEOメディアとコーポレートサイトを統合したプラットフォーム'
    )
    expect(description).toBeInTheDocument()
  })

  it('適切なスタイルクラスが適用されている', () => {
    const { container } = render(<Home />)

    const mainElement = container.querySelector('main')
    expect(mainElement).toHaveClass('min-h-screen')
  })
})
