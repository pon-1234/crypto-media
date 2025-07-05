/**
 * 記事一覧ページのテスト
 * @issue #28 - 記事一覧ページの機能拡張
 */
import { render, screen } from '@testing-library/react'
import MediaArticlesPage from '../page'
import { getMediaArticlesList, getCategories, getTags } from '@/lib/microcms'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type {
  MediaArticle,
  Category,
  Tag,
  MicroCMSListResponse,
} from '@/lib/microcms'

// モック
vi.mock('@/lib/microcms', () => ({
  getMediaArticlesList: vi.fn(),
  getCategories: vi.fn(),
  getTags: vi.fn(),
}))

vi.mock('@/components/media/ArticleCard', () => ({
  ArticleCard: ({ article }: { article: MediaArticle }) => (
    <div data-testid={`article-${article.id}`}>{article.title}</div>
  ),
}))

vi.mock('@/components/ui/Pagination', () => ({
  Pagination: ({
    currentPage,
    totalPages,
  }: {
    currentPage: number
    totalPages: number
  }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
    </div>
  ),
}))

vi.mock('@/components/media/ArticleFilters', () => ({
  ArticleFilters: ({
    selectedCategory,
    selectedTag,
  }: {
    selectedCategory?: string
    selectedTag?: string
  }) => (
    <div data-testid="filters">
      {selectedCategory && <span>Category: {selectedCategory}</span>}
      {selectedTag && <span>Tag: {selectedTag}</span>}
    </div>
  ),
}))

const mockArticles: MicroCMSListResponse<MediaArticle> = {
  contents: [
    {
      id: '1',
      type: 'article',
      title: 'Article 1',
      slug: 'article-1',
      content: 'Content 1',
      heroImage: {
        url: 'https://example.com/image1.jpg',
        width: 1200,
        height: 630,
      },
      category: {
        id: 'cat1',
        name: 'Category 1',
        slug: 'category-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        publishedAt: '2024-01-01T00:00:00.000Z',
        revisedAt: '2024-01-01T00:00:00.000Z',
      },
      tags: [],
      publishedAt: '2024-01-01T00:00:00.000Z',
      membershipLevel: 'public',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      type: 'article',
      title: 'Article 2',
      slug: 'article-2',
      content: 'Content 2',
      heroImage: {
        url: 'https://example.com/image2.jpg',
        width: 1200,
        height: 630,
      },
      category: {
        id: 'cat2',
        name: 'Category 2',
        slug: 'category-2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        publishedAt: '2024-01-01T00:00:00.000Z',
        revisedAt: '2024-01-01T00:00:00.000Z',
      },
      tags: [],
      publishedAt: '2024-01-02T00:00:00.000Z',
      membershipLevel: 'paid',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      revisedAt: '2024-01-02T00:00:00.000Z',
    },
  ],
  totalCount: 25,
  offset: 0,
  limit: 12,
}

const mockCategories: MicroCMSListResponse<Category> = {
  contents: [
    {
      id: 'cat1',
      name: 'Category 1',
      slug: 'category-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat2',
      name: 'Category 2',
      slug: 'category-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  totalCount: 2,
  offset: 0,
  limit: 100,
}

const mockTags: MicroCMSListResponse<Tag> = {
  contents: [
    {
      id: 'tag1',
      name: 'Tag 1',
      slug: 'tag-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'tag2',
      name: 'Tag 2',
      slug: 'tag-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  totalCount: 2,
  offset: 0,
  limit: 100,
}

describe('MediaArticlesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMediaArticlesList).mockResolvedValue(mockArticles)
    vi.mocked(getCategories).mockResolvedValue(mockCategories)
    vi.mocked(getTags).mockResolvedValue(mockTags)
  })

  it('記事一覧が正しく表示される', async () => {
    const page = await MediaArticlesPage({ searchParams: {} })
    render(page)

    // ページタイトル
    expect(screen.getByText('記事一覧')).toBeInTheDocument()
    expect(
      screen.getByText(
        '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。'
      )
    ).toBeInTheDocument()

    // 記事カード
    expect(screen.getByTestId('article-1')).toBeInTheDocument()
    expect(screen.getByTestId('article-2')).toBeInTheDocument()

    // フィルタリング
    expect(screen.getByTestId('filters')).toBeInTheDocument()

    // ページネーション
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument() // 25件 / 12件 = 3ページ
  })

  it('ページネーションが正しく機能する', async () => {
    const page = await MediaArticlesPage({ searchParams: { page: '2' } })
    render(page)

    expect(vi.mocked(getMediaArticlesList)).toHaveBeenCalledWith({
      limit: 12,
      offset: 12, // (2-1) * 12
      orders: '-publishedAt',
      filters: undefined,
    })

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  })

  it('カテゴリフィルタが適用される', async () => {
    const page = await MediaArticlesPage({
      searchParams: { category: 'category-1' },
    })
    render(page)

    // カテゴリslugでの検索が呼ばれる
    expect(vi.mocked(getCategories)).toHaveBeenCalledWith({
      filters: 'slug[equals]category-1',
    })

    // 記事一覧APIにフィルタが適用される
    expect(vi.mocked(getMediaArticlesList)).toHaveBeenCalledWith({
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'category[equals]cat1',
    })

    // フィルタコンポーネントに選択されたカテゴリが渡される
    expect(screen.getByText('Category: category-1')).toBeInTheDocument()
  })

  it('タグフィルタが適用される', async () => {
    const page = await MediaArticlesPage({ searchParams: { tag: 'tag-1' } })
    render(page)

    // タグslugでの検索が呼ばれる
    expect(vi.mocked(getTags)).toHaveBeenCalledWith({
      filters: 'slug[equals]tag-1',
    })

    // 記事一覧APIにフィルタが適用される
    expect(vi.mocked(getMediaArticlesList)).toHaveBeenCalledWith({
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'tags[contains]tag1',
    })

    // フィルタコンポーネントに選択されたタグが渡される
    expect(screen.getByText('Tag: tag-1')).toBeInTheDocument()
  })

  it('複数フィルタが同時に適用される', async () => {
    const page = await MediaArticlesPage({
      searchParams: { category: 'category-1', tag: 'tag-1' },
    })
    render(page)

    // 記事一覧APIに複合フィルタが適用される
    expect(vi.mocked(getMediaArticlesList)).toHaveBeenCalledWith({
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'category[equals]cat1[and]tags[contains]tag1',
    })

    // 両方のフィルタが表示される
    expect(screen.getByText('Category: category-1')).toBeInTheDocument()
    expect(screen.getByText('Tag: tag-1')).toBeInTheDocument()
  })

  it('記事がない場合のメッセージが表示される', async () => {
    const emptyArticles: MicroCMSListResponse<MediaArticle> = {
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 12,
    }
    vi.mocked(getMediaArticlesList).mockResolvedValue(emptyArticles)

    const page = await MediaArticlesPage({ searchParams: {} })
    render(page)

    expect(screen.getByText('記事がありません。')).toBeInTheDocument()
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
  })

  it.skip('エラー時はエラーバウンダリーに委譲される', async () => {
    const error = new Error('API Error')
    vi.mocked(getMediaArticlesList).mockRejectedValue(error)

    await expect(MediaArticlesPage({ searchParams: {} })).rejects.toThrow(
      'API Error'
    )
  })

  it('1ページのみの場合はページネーションが表示されない', async () => {
    vi.mocked(getMediaArticlesList).mockResolvedValue({
      ...mockArticles,
      totalCount: 10, // 12件以下
    })

    const page = await MediaArticlesPage({ searchParams: {} })
    render(page)

    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
  })

  it('ページ件数の表示が正しい', async () => {
    const page = await MediaArticlesPage({ searchParams: {} })
    render(page)

    // テキストが分割されているため、部分的に確認
    const textContent = screen.getByText(/件を表示/).parentElement?.textContent
    expect(textContent).toContain('全25件中')
    expect(textContent).toContain('1-2件を表示')
  })

  it('最終ページの件数表示が正しい', async () => {
    vi.mocked(getMediaArticlesList).mockResolvedValue({
      ...mockArticles,
      contents: [mockArticles.contents[0]], // 1件のみ
      offset: 24,
      totalCount: 25,
    })

    const page = await MediaArticlesPage({ searchParams: { page: '3' } })
    render(page)

    // テキストが分割されているため、部分的に確認
    const textContent = screen.getByText(/件を表示/).parentElement?.textContent
    expect(textContent).toContain('全25件中')
    expect(textContent).toContain('25-25件を表示')
  })
})
