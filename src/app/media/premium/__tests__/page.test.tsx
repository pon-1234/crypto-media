/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import PremiumArticlesPage from '../page'
import {
  getMediaArticlesByMembershipLevel,
  getCategories,
  getTags,
} from '@/lib/microcms'
import type { MediaArticle, Category, Tag } from '@/lib/schema'

vi.mock('@/lib/microcms', () => ({
  getMediaArticlesByMembershipLevel: vi.fn(),
  getCategories: vi.fn(),
  getTags: vi.fn(),
}))

vi.mock('@/components/media/ArticleCard', () => ({
  ArticleCard: vi.fn(({ article }) => (
    <div data-testid={`article-${article.id}`}>{article.title}</div>
  )),
}))

vi.mock('@/components/ui/Pagination', () => ({
  Pagination: vi.fn(({ currentPage, totalPages }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
    </div>
  )),
}))

vi.mock('@/components/media/ArticleFilters', () => ({
  ArticleFilters: vi.fn(({ selectedCategory, selectedTag }) => (
    <div data-testid="filters">
      Category: {selectedCategory || 'none'}, Tag: {selectedTag || 'none'}
    </div>
  )),
}))

describe('PremiumArticlesPage', () => {
  const mockArticles: MediaArticle[] = [
    {
      id: '1',
      title: 'プレミアム記事1',
      slug: 'premium-1',
      type: 'article',
      membershipLevel: 'paid',
      content: '有料コンテンツ1',
      heroImage: {
        url: 'https://example.com/image1.jpg',
        width: 1200,
        height: 630,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      publishedAt: '2024-01-01T00:00:00Z',
      revisedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'プレミアム記事2',
      slug: 'premium-2',
      type: 'survey_report',
      membershipLevel: 'paid',
      content: '有料コンテンツ2',
      heroImage: {
        url: 'https://example.com/image2.jpg',
        width: 1200,
        height: 630,
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      publishedAt: '2024-01-02T00:00:00Z',
      revisedAt: '2024-01-02T00:00:00Z',
    },
  ]

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'DeFi',
      slug: 'defi',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ]

  const mockTags: Tag[] = [
    {
      id: 'tag1',
      name: 'Bitcoin',
      slug: 'bitcoin',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ]

  it('有料記事一覧を正しく表示する', async () => {
    vi.mocked(getMediaArticlesByMembershipLevel).mockResolvedValue({
      contents: mockArticles,
      totalCount: 2,
      offset: 0,
      limit: 12,
    })
    vi.mocked(getCategories).mockResolvedValue({
      contents: mockCategories,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })
    vi.mocked(getTags).mockResolvedValue({
      contents: mockTags,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    const page = await PremiumArticlesPage({ searchParams: {} })

    expect(getMediaArticlesByMembershipLevel).toHaveBeenCalledWith('paid', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'membershipLevel[equals]paid',
    })
    expect(page).toMatchSnapshot()
  })

  it('ページネーションが正しく動作する', async () => {
    vi.mocked(getMediaArticlesByMembershipLevel).mockResolvedValue({
      contents: mockArticles,
      totalCount: 30,
      offset: 12,
      limit: 12,
    })
    vi.mocked(getCategories).mockResolvedValue({
      contents: mockCategories,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })
    vi.mocked(getTags).mockResolvedValue({
      contents: mockTags,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    const page = await PremiumArticlesPage({ searchParams: { page: '2' } })

    expect(getMediaArticlesByMembershipLevel).toHaveBeenCalledWith('paid', {
      limit: 12,
      offset: 12,
      orders: '-publishedAt',
      filters: 'membershipLevel[equals]paid',
    })
    expect(page).toMatchSnapshot()
  })

  it('カテゴリフィルタが適用される', async () => {
    vi.mocked(getCategories)
      .mockResolvedValueOnce({
        contents: [mockCategories[0]],
        totalCount: 1,
        offset: 0,
        limit: 1,
      })
      .mockResolvedValueOnce({
        contents: mockCategories,
        totalCount: 1,
        offset: 0,
        limit: 100,
      })

    vi.mocked(getMediaArticlesByMembershipLevel).mockResolvedValue({
      contents: mockArticles,
      totalCount: 2,
      offset: 0,
      limit: 12,
    })
    vi.mocked(getTags).mockResolvedValue({
      contents: mockTags,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    await PremiumArticlesPage({ searchParams: { category: 'defi' } })

    expect(getCategories).toHaveBeenCalledWith({ filters: 'slug[equals]defi' })
    expect(getMediaArticlesByMembershipLevel).toHaveBeenCalledWith('paid', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'membershipLevel[equals]paid[and]category[equals]cat1',
    })
  })

  it('指定されたカテゴリが存在しない場合、カテゴリフィルタは適用されない', async () => {
    vi.mocked(getCategories)
      .mockResolvedValueOnce({
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1,
      }) // No category found
      .mockResolvedValueOnce({
        contents: mockCategories,
        totalCount: 1,
        offset: 0,
        limit: 100,
      }) // For filters

    vi.mocked(getMediaArticlesByMembershipLevel).mockResolvedValue({
      contents: mockArticles,
      totalCount: 2,
      offset: 0,
      limit: 12,
    })
    vi.mocked(getTags).mockResolvedValue({
      contents: mockTags,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    await PremiumArticlesPage({ searchParams: { category: 'unknown' } })

    expect(getMediaArticlesByMembershipLevel).toHaveBeenCalledWith('paid', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'membershipLevel[equals]paid',
    })
  })

  it('指定されたタグが存在しない場合、タグフィルタは適用されない', async () => {
    vi.mocked(getTags)
      .mockResolvedValueOnce({
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1,
      }) // No tag found
      .mockResolvedValueOnce({
        contents: mockTags,
        totalCount: 1,
        offset: 0,
        limit: 100,
      }) // For filters

    vi.mocked(getMediaArticlesByMembershipLevel).mockResolvedValue({
      contents: mockArticles,
      totalCount: 2,
      offset: 0,
      limit: 12,
    })
    vi.mocked(getCategories).mockResolvedValue({
      contents: mockCategories,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    await PremiumArticlesPage({ searchParams: { tag: 'unknown' } })

    expect(getMediaArticlesByMembershipLevel).toHaveBeenCalledWith('paid', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'membershipLevel[equals]paid',
    })
  })

  it('記事が0件の場合、メッセージを表示する', async () => {
    vi.mocked(getMediaArticlesByMembershipLevel).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 12,
    })
    vi.mocked(getCategories).mockResolvedValue({
      contents: mockCategories,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })
    vi.mocked(getTags).mockResolvedValue({
      contents: mockTags,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    const page = await PremiumArticlesPage({ searchParams: {} })

    expect(page).toMatchSnapshot()
  })

  it('エラーが発生した場合、エラーをスローする', async () => {
    const error = new Error('API Error')
    vi.mocked(getMediaArticlesByMembershipLevel).mockRejectedValue(error)

    await expect(PremiumArticlesPage({ searchParams: {} })).rejects.toThrow(
      'API Error'
    )
  })
})
