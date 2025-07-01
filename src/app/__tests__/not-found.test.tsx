/**
 * not-found.tsx の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from '../not-found'

describe('NotFound', () => {
  it('404エラーメッセージが表示される', () => {
    render(<NotFound />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('ページが見つかりません')).toBeInTheDocument()
    expect(
      screen.getByText(
        'お探しのページは、移動または削除された可能性があります。'
      )
    ).toBeInTheDocument()
  })

  it('コーポレートサイトへのリンクが表示される', () => {
    render(<NotFound />)

    const corporateLink = screen.getByRole('link', {
      name: 'コーポレートサイトへ',
    })
    expect(corporateLink).toBeInTheDocument()
    expect(corporateLink).toHaveAttribute('href', '/')
  })

  it('メディアサイトへのリンクが表示される', () => {
    render(<NotFound />)

    const mediaLink = screen.getByRole('link', { name: 'メディアサイトへ' })
    expect(mediaLink).toBeInTheDocument()
    expect(mediaLink).toHaveAttribute('href', '/media')
  })

  it('お問い合わせリンクが表示される', () => {
    render(<NotFound />)

    const contactLink = screen.getByRole('link', { name: 'お問い合わせ' })
    expect(contactLink).toBeInTheDocument()
    expect(contactLink).toHaveAttribute('href', '/contact')
  })

  it('適切なスタイルクラスが適用されている', () => {
    const { container } = render(<NotFound />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass(
      'min-h-screen',
      'flex',
      'items-center',
      'justify-center',
      'bg-gray-50'
    )
  })
})
