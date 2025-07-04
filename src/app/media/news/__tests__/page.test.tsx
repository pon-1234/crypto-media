/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import MediaNewsPage from '../page'
import { getMediaArticlesByType, getCategories, getTags } from '@/lib/microcms'
import type { MediaArticle, Category, Tag } from '@/lib/schema'

vi.mock('@/lib/microcms', () => ({
  getMediaArticlesByType: vi.fn(),
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

describe('MediaNewsPage', () => {
  const mockArticles: MediaArticle[] = [
    {
      id: '1',
      title: 'メディアニュース1',
      slug: 'news-1',
      type: 'media_news',
      membershipLevel: 'public',
      content: 'ニュース内容1',
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
      title: 'メディアニュース2',
      slug: 'news-2',
      type: 'media_news',
      membershipLevel: 'public',
      content: 'ニュース内容2',
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
      name: 'Announcement',
      slug: 'announcement',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ]

  const mockTags: Tag[] = [
    {
      id: 'tag1',
      name: 'Update',
      slug: 'update',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ]

  it('メディアニュース一覧を正しく表示する', async () => {
    vi.mocked(getMediaArticlesByType).mockResolvedValue({
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

    const page = await MediaNewsPage({ searchParams: {} })

    expect(getMediaArticlesByType).toHaveBeenCalledWith('media_news', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: undefined,
    })
    expect(page).toMatchSnapshot()
  })

  it('ページネーションが正しく動作する', async () => {
    vi.mocked(getMediaArticlesByType).mockResolvedValue({
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

    const page = await MediaNewsPage({ searchParams: { page: '2' } })

    expect(getMediaArticlesByType).toHaveBeenCalledWith('media_news', {
      limit: 12,
      offset: 12,
      orders: '-publishedAt',
      filters: undefined,
    })
    expect(page).toMatchSnapshot()
  })

  it('カテゴリとタグの複合フィルタが適用される', async () => {
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

    vi.mocked(getTags)
      .mockResolvedValueOnce({
        contents: [mockTags[0]],
        totalCount: 1,
        offset: 0,
        limit: 1,
      })
      .mockResolvedValueOnce({
        contents: mockTags,
        totalCount: 1,
        offset: 0,
        limit: 100,
      })

    vi.mocked(getMediaArticlesByType).mockResolvedValue({
      contents: mockArticles,
      totalCount: 2,
      offset: 0,
      limit: 12,
    })

    await MediaNewsPage({
      searchParams: { category: 'announcement', tag: 'update' },
    })

    expect(getCategories).toHaveBeenCalledWith({
      filters: 'slug[equals]announcement',
    })
    expect(getTags).toHaveBeenCalledWith({ filters: 'slug[equals]update' })
    expect(getMediaArticlesByType).toHaveBeenCalledWith('media_news', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters:
        'type[equals]media_news[and]category[equals]cat1[and]tags[contains]tag1',
    })
  })

  it('記事が0件の場合、メッセージを表示する', async () => {
    vi.mocked(getMediaArticlesByType).mockResolvedValue({
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

    const page = await MediaNewsPage({ searchParams: {} })

    expect(page).toMatchSnapshot()
  })

  it('エラーが発生した場合、エラーをスローする', async () => {
    const error = new Error('API Error')
    vi.mocked(getMediaArticlesByType).mockRejectedValue(error)

    await expect(MediaNewsPage({ searchParams: {} })).rejects.toThrow(
      'API Error'
    )
  })
})
