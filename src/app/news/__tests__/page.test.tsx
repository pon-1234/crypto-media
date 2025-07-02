import { render, screen } from '@testing-library/react'
import NewsListPage from '../page'
import { getCorporateNewsList } from '@/lib/microcms'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock microCMS client
vi.mock('@/lib/microcms', () => ({
  getCorporateNewsList: vi.fn(),
}))

// Mock Pagination component
vi.mock('@/components/ui/Pagination', () => ({
  Pagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
    </div>
  ),
}))

const mockNews = {
  contents: [
    {
      id: '1',
      title: 'お知らせ1',
      content: 'コンテンツ1',
      publishedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'お知らせ2',
      content: 'コンテンツ2',
      publishedAt: '2024-01-02T00:00:00.000Z',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ],
  totalCount: 25,
  offset: 0,
  limit: 10,
}

describe('NewsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCorporateNewsList).mockResolvedValue(mockNews)
  })

  it('お知らせ一覧が正しく表示される', async () => {
    const page = await NewsListPage({ searchParams: Promise.resolve({}) })
    render(page)

    expect(screen.getByText('お知らせ')).toBeInTheDocument()
    expect(screen.getByText('お知らせ1')).toBeInTheDocument()
    expect(screen.getByText('お知らせ2')).toBeInTheDocument()
  })

  it('ページネーションが複数ページの場合に表示される', async () => {
    const page = await NewsListPage({ searchParams: Promise.resolve({}) })
    render(page)

    expect(screen.getByTestId('pagination')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument() // 25件 / 10件 = 3ページ
  })

  it('ページネーションが1ページのみの場合は表示されない', async () => {
    vi.mocked(getCorporateNewsList).mockResolvedValue({
      ...mockNews,
      totalCount: 5, // 10件以下
    })

    const page = await NewsListPage({ searchParams: Promise.resolve({}) })
    render(page)

    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
  })

  it('2ページ目が正しく取得される', async () => {
    const page = await NewsListPage({ searchParams: Promise.resolve({ page: '2' }) })
    render(page)

    expect(vi.mocked(getCorporateNewsList)).toHaveBeenCalledWith({
      limit: 10,
      offset: 10, // (2-1) * 10
      orders: '-publishedAt',
    })

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  })

  it('お知らせがない場合のメッセージが表示される', async () => {
    vi.mocked(getCorporateNewsList).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 10,
    })

    const page = await NewsListPage({ searchParams: Promise.resolve({}) })
    render(page)

    expect(screen.getByText('お知らせはありません。')).toBeInTheDocument()
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
  })

  it('最終ページが正しく計算される', async () => {
    vi.mocked(getCorporateNewsList).mockResolvedValue({
      ...mockNews,
      totalCount: 21, // 3ページ目は1件のみ
    })

    const page = await NewsListPage({ searchParams: Promise.resolve({ page: '3' }) })
    render(page)

    expect(vi.mocked(getCorporateNewsList)).toHaveBeenCalledWith({
      limit: 10,
      offset: 20, // (3-1) * 10
      orders: '-publishedAt',
    })

    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
  })

  it('無効なページ番号の場合は1ページ目として扱われる', async () => {
    const page = await NewsListPage({ searchParams: Promise.resolve({ page: 'invalid' }) })
    render(page)

    expect(vi.mocked(getCorporateNewsList)).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      orders: '-publishedAt',
    })

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  it('日付フォーマットが正しく表示される', async () => {
    const page = await NewsListPage({ searchParams: Promise.resolve({}) })
    render(page)

    // formatDate関数により変換された日付が表示される
    expect(screen.getByText('2024年1月1日')).toBeInTheDocument()
    expect(screen.getByText('2024年1月2日')).toBeInTheDocument()
  })
})