import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchPage, { generateMetadata } from '../page'
import * as microCMS from '@/lib/microcms'

// Mock microCMS
vi.mock('@/lib/microcms', () => ({
  searchMediaArticles: vi.fn(),
}))

// Mock components
vi.mock('@/components/ui/Breadcrumbs', () => ({
  Breadcrumbs: ({ items }: { items: Array<{ label: string }> }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item, index) => (
        <span key={index}>{item.label}</span>
      ))}
    </nav>
  ),
}))

vi.mock('@/components/media/SearchResultGrid', () => ({
  SearchResultGrid: ({ articles, query }: { articles: unknown[]; query: string }) => (
    <div data-testid="search-result-grid">
      <div>Query: {query}</div>
      <div>Results: {articles.length}</div>
    </div>
  ),
}))

vi.mock('@/components/ui/Pagination', () => ({
  Pagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
    </div>
  ),
}))

vi.mock('@/components/ui/SearchForm', () => ({
  SearchForm: ({ placeholder }: { placeholder?: string }) => (
    <form data-testid="search-form">
      <input placeholder={placeholder || '記事を検索...'} />
    </form>
  ),
}))

const mockArticles = {
  contents: [
    {
      id: '1',
      type: 'article' as const,
      title: 'ビットコインの基礎知識',
      slug: 'bitcoin-basics',
      description: 'ビットコインについて解説',
      content: 'コンテンツ',
      publishedAt: '2024-01-01T00:00:00.000Z',
      membershipLevel: 'public' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  totalCount: 25,
  offset: 0,
  limit: 12,
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateMetadata', () => {
    it('検索クエリがある場合のメタデータを生成する', async () => {
      const metadata = await generateMetadata({
        searchParams: { q: 'ビットコイン' },
      })

      expect(metadata.title).toBe('「ビットコイン」の検索結果 | Crypto Media')
      expect(metadata.description).toBe('「ビットコイン」に関する記事の検索結果です。')
      expect(metadata.robots).toBe('noindex, follow')
    })

    it('検索クエリがない場合のメタデータを生成する', async () => {
      const metadata = await generateMetadata({
        searchParams: {},
      })

      expect(metadata.title).toBe('検索 | Crypto Media')
      expect(metadata.description).toBe('暗号資産・ブロックチェーンに関する記事を検索できます。')
    })
  })

  describe('Page component', () => {
    it('検索クエリがない場合は検索フォームのみ表示する', async () => {
      const Component = await SearchPage({ searchParams: {} })
      render(Component)

      expect(screen.getByText('記事を検索')).toBeInTheDocument()
      expect(screen.getByTestId('search-form')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('キーワードを入力してください')).toBeInTheDocument()
      expect(screen.getByText('記事のタイトル、本文、タグなどから検索できます。')).toBeInTheDocument()
    })

    it('検索結果を表示する', async () => {
      vi.mocked(microCMS.searchMediaArticles).mockResolvedValue(mockArticles)

      const Component = await SearchPage({
        searchParams: { q: 'ビットコイン' },
      })
      render(Component)

      expect(screen.getByText('「ビットコイン」の検索結果')).toBeInTheDocument()
      expect(screen.getByText('25件の記事が見つかりました')).toBeInTheDocument()
      expect(screen.getByTestId('search-result-grid')).toBeInTheDocument()
      expect(screen.getByText('Query: ビットコイン')).toBeInTheDocument()
    })

    it('ページネーションを表示する', async () => {
      vi.mocked(microCMS.searchMediaArticles).mockResolvedValue(mockArticles)

      const Component = await SearchPage({
        searchParams: { q: 'イーサリアム', page: '2' },
      })
      render(Component)

      expect(screen.getByTestId('pagination')).toBeInTheDocument()
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument() // 25/12 = 3ページ
    })

    it('検索結果が0件の場合のメッセージを表示する', async () => {
      vi.mocked(microCMS.searchMediaArticles).mockResolvedValue({
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 12,
      })

      const Component = await SearchPage({
        searchParams: { q: '存在しないキーワード' },
      })
      render(Component)

      expect(screen.getByText('「存在しないキーワード」に一致する記事が見つかりませんでした。')).toBeInTheDocument()
      expect(screen.getByText('別のキーワードで検索してみてください。')).toBeInTheDocument()
    })

    it('エラー時はエラーメッセージを表示する', async () => {
      vi.mocked(microCMS.searchMediaArticles).mockRejectedValue(new Error('API Error'))

      const Component = await SearchPage({
        searchParams: { q: 'エラーテスト' },
      })
      render(Component)

      expect(screen.getByText('検索中にエラーが発生しました。')).toBeInTheDocument()
      expect(screen.getByText('検索結果を表示できませんでした。')).toBeInTheDocument()
    })

    it('ページネーションのoffsetが正しく計算される', async () => {
      vi.mocked(microCMS.searchMediaArticles).mockResolvedValue(mockArticles)

      await SearchPage({
        searchParams: { q: 'DeFi', page: '3' },
      })

      expect(microCMS.searchMediaArticles).toHaveBeenCalledWith('DeFi', {
        limit: 12,
        offset: 24, // (3-1) * 12
      })
    })

    it('1ページのみの場合はページネーションを表示しない', async () => {
      vi.mocked(microCMS.searchMediaArticles).mockResolvedValue({
        ...mockArticles,
        totalCount: 10, // 12件以下
      })

      const Component = await SearchPage({
        searchParams: { q: 'NFT' },
      })
      render(Component)

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
    })

    it('パンくずリストが正しく表示される', async () => {
      const Component = await SearchPage({
        searchParams: { q: 'Web3' },
      })
      render(Component)

      const breadcrumbs = screen.getByTestId('breadcrumbs')
      expect(breadcrumbs).toHaveTextContent('HOME')
      expect(breadcrumbs).toHaveTextContent('MEDIA')
      expect(breadcrumbs).toHaveTextContent('検索結果')
    })
  })
})