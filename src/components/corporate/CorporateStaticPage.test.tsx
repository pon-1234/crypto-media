import { vi, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import { CorporateStaticPage } from './CorporateStaticPage'
import { createMockCorporatePage } from '@/test/helpers/corporateStaticPage'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound')
  }),
}))

vi.mock('@/components/corporate/CorporatePageContent', () => ({
  CorporatePageContent: vi.fn(({ page }) => (
    <div data-testid="corporate-page-content">{page.content}</div>
  )),
}))

describe('CorporateStaticPage', () => {
  it('ページが存在する場合は正常に表示される', () => {
    const mockPage = createMockCorporatePage({
      title: 'テストタイトル',
      content: '<p>テストコンテンツ</p>',
    })

    render(<CorporateStaticPage page={mockPage} />)

    expect(screen.getByRole('heading', { level: 1, name: 'テストタイトル' })).toBeInTheDocument()
    expect(screen.getByTestId('corporate-page-content')).toBeInTheDocument()
    expect(screen.getByText('<p>テストコンテンツ</p>')).toBeInTheDocument()
  })

  it('ページがnullの場合は404エラーを発生させる', () => {
    expect(() => {
      render(<CorporateStaticPage page={null} />)
    }).toThrow('notFound')

    expect(notFound).toHaveBeenCalled()
  })

  it('適切なレイアウト構造を持つ', () => {
    const mockPage = createMockCorporatePage()

    const { container } = render(<CorporateStaticPage page={mockPage} />)

    const main = container.querySelector('main')
    expect(main).toHaveClass('min-h-screen')

    const containerDiv = main?.querySelector('.container')
    expect(containerDiv).toHaveClass('mx-auto', 'px-4', 'py-16')

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('mb-8', 'text-4xl', 'font-bold')
  })
})