/**
 * ページネーションコンポーネントのテスト
 * @issue #28 - 記事一覧ページの機能拡張
 */
import { render, screen } from '@testing-library/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Pagination } from '../Pagination'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// next/navigationのモック
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('Pagination', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/media/articles')
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>)
  })

  it('基本的なページネーションが正しく表示される', () => {
    render(<Pagination currentPage={1} totalPages={5} />)

    // ページ番号が表示されることを確認
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    // 現在のページが正しくマークされている
    const currentPageLink = screen.getByRole('link', { current: 'page' })
    expect(currentPageLink).toHaveTextContent('1')

    // 「前へ」リンクは表示されない（最初のページのため）
    expect(screen.queryByText('前へ')).not.toBeInTheDocument()

    // 「次へ」リンクは表示される
    expect(screen.getByText('次へ')).toBeInTheDocument()
  })

  it('中間ページでは前後のリンクが表示される', () => {
    render(<Pagination currentPage={3} totalPages={5} />)

    // 前へと次へのリンクが両方表示される
    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()

    // 現在のページが正しくマークされている
    const currentPageLink = screen.getByRole('link', { current: 'page' })
    expect(currentPageLink).toHaveTextContent('3')
  })

  it('最終ページでは「次へ」リンクが表示されない', () => {
    render(<Pagination currentPage={5} totalPages={5} />)

    // 「前へ」リンクは表示される
    expect(screen.getByText('前へ')).toBeInTheDocument()

    // 「次へ」リンクは表示されない
    expect(screen.queryByText('次へ')).not.toBeInTheDocument()
  })

  it('多数のページがある場合、省略記号が表示される', () => {
    render(<Pagination currentPage={5} totalPages={10} />)

    // 最初と最後のページは常に表示される
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()

    // 現在のページ周辺が表示される
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()

    // 省略記号が表示される
    const dots = screen.getAllByText('...')
    expect(dots).toHaveLength(1)
  })

  it('既存のクエリパラメータが保持される', () => {
    const searchParams = new URLSearchParams('category=blockchain&sort=newest')
    vi.mocked(useSearchParams).mockReturnValue(searchParams as unknown as ReturnType<typeof useSearchParams>)

    render(<Pagination currentPage={1} totalPages={3} />)

    // 次へリンクのhrefを確認
    const nextLink = screen.getByText('次へ').closest('a')
    expect(nextLink).toHaveAttribute('href', '/media/articles?category=blockchain&sort=newest&page=2')
  })

  it('カスタムクラスが適用される', () => {
    render(<Pagination currentPage={1} totalPages={3} className="mt-8" />)

    const nav = screen.getByRole('navigation', { name: 'ページネーション' })
    expect(nav).toHaveClass('mt-8')
  })

  it('単一ページの場合、何も表示しない', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} />)
    expect(container.firstChild).toBeNull()
  })

  it('ページ番号のリンクが正しいURLを生成する', () => {
    render(<Pagination currentPage={2} totalPages={5} />)

    // 各ページ番号のリンクを確認
    const page1Link = screen.getByText('1').closest('a')
    expect(page1Link).toHaveAttribute('href', '/media/articles?page=1')

    const page3Link = screen.getByText('3').closest('a')
    expect(page3Link).toHaveAttribute('href', '/media/articles?page=3')

    const page5Link = screen.getByText('5').closest('a')
    expect(page5Link).toHaveAttribute('href', '/media/articles?page=5')
  })
})