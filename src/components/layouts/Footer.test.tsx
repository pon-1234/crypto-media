import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

describe('Footer', () => {
  it('should render all corporate links', () => {
    render(<Footer />)

    expect(screen.getByText('コーポレート')).toBeInTheDocument()
    const corporateSection = screen.getByText('コーポレート').closest('div')

    expect(corporateSection).toContainHTML('トップ')
    expect(corporateSection).toContainHTML('会社概要')
    expect(corporateSection).toContainHTML('事業内容')
    expect(corporateSection).toContainHTML('採用情報')
    expect(corporateSection).toContainHTML('お知らせ')
    expect(corporateSection).toContainHTML('お問い合わせ')
  })

  it('should render all media links', () => {
    render(<Footer />)

    expect(screen.getByText('メディア')).toBeInTheDocument()
    const mediaSection = screen.getByText('メディア').closest('div')

    expect(mediaSection).toContainHTML('メディアトップ')
    expect(mediaSection).toContainHTML('記事一覧')
    expect(mediaSection).toContainHTML('カテゴリ')
    expect(mediaSection).toContainHTML('執筆者・監修者')
    expect(mediaSection).toContainHTML('特集')
    expect(mediaSection).toContainHTML('有料限定記事')
  })

  it('should render all legal links', () => {
    render(<Footer />)

    expect(screen.getByText('法的情報')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '利用規約' })).toHaveAttribute(
      'href',
      '/terms/'
    )
    expect(
      screen.getByRole('link', { name: '個人情報保護方針' })
    ).toHaveAttribute('href', '/privacy-policy/')
    expect(
      screen.getByRole('link', { name: '特定商取引法に基づく表記' })
    ).toHaveAttribute('href', '/dealing/')
  })

  it('should render contact section with link', () => {
    render(<Footer />)

    const contactHeading = screen
      .getAllByText('お問い合わせ')
      .find((el) => el.tagName === 'H3')
    expect(contactHeading).toBeInTheDocument()
    expect(
      screen.getByText(
        'ご質問やご意見がございましたら、お気軽にお問い合わせください。'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'お問い合わせフォーム' })
    ).toHaveAttribute('href', '/contact')
  })

  it('should render copyright with current year', () => {
    const currentYear = new Date().getFullYear()
    render(<Footer />)

    expect(
      screen.getByText(
        `© ${currentYear} 株式会社[会社名]. All rights reserved.`
      )
    ).toBeInTheDocument()
  })

  it('should have correct structure with grid layout', () => {
    render(<Footer />)

    const footerElement = screen.getByRole('contentinfo')
    expect(footerElement).toHaveClass('bg-gray-100', 'border-t')

    const gridContainer = footerElement.querySelector('.grid')
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-4', 'gap-8')
  })
})
