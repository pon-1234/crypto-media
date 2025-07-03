/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import SurveyReportsPage from '../page'
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

describe('SurveyReportsPage', () => {
  const mockArticles: MediaArticle[] = [
    {
      id: '1',
      title: '市場調査レポート1',
      slug: 'survey-1',
      type: 'survey_report',
      membershipLevel: 'public',
      content: '調査内容1',
      heroImage: { url: 'https://example.com/image1.jpg', width: 1200, height: 630 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      publishedAt: '2024-01-01T00:00:00Z',
      revisedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: '市場調査レポート2',
      slug: 'survey-2',
      type: 'survey_report',
      membershipLevel: 'paid',
      content: '調査内容2',
      heroImage: { url: 'https://example.com/image2.jpg', width: 1200, height: 630 },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      publishedAt: '2024-01-02T00:00:00Z',
      revisedAt: '2024-01-02T00:00:00Z',
    },
  ]

  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Market Analysis', slug: 'market-analysis', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  ]

  const mockTags: Tag[] = [
    { id: 'tag1', name: 'Research', slug: 'research', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  ]

  it('調査レポート一覧を正しく表示する', async () => {
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

    const page = await SurveyReportsPage({ searchParams: {} })

    expect(getMediaArticlesByType).toHaveBeenCalledWith('survey_report', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'type[equals]survey_report',
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

    const page = await SurveyReportsPage({ searchParams: { page: '2' } })

    expect(getMediaArticlesByType).toHaveBeenCalledWith('survey_report', {
      limit: 12,
      offset: 12,
      orders: '-publishedAt',
      filters: 'type[equals]survey_report',
    })
    expect(page).toMatchSnapshot()
  })

  it('タグフィルタが適用される', async () => {
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
    vi.mocked(getCategories).mockResolvedValue({
      contents: mockCategories,
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    await SurveyReportsPage({ searchParams: { tag: 'research' } })

    expect(getTags).toHaveBeenCalledWith({ filters: 'slug[equals]research' })
    expect(getMediaArticlesByType).toHaveBeenCalledWith('survey_report', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'type[equals]survey_report[and]tags[contains]tag1',
    })
  })

  it('指定されたカテゴリが存在しない場合、カテゴリフィルタは適用されない', async () => {
    vi.mocked(getCategories)
      .mockResolvedValueOnce({ contents: [], totalCount: 0, offset: 0, limit: 1 }) // No category found
      .mockResolvedValueOnce({ contents: mockCategories, totalCount: 1, offset: 0, limit: 100 }) // For filters

    vi.mocked(getMediaArticlesByType).mockResolvedValue({
      contents: mockArticles,
      totalCount: 2,
      offset: 0,
      limit: 12,
    })
    vi.mocked(getTags).mockResolvedValue({ contents: mockTags, totalCount: 1, offset: 0, limit: 100 })

    await SurveyReportsPage({ searchParams: { category: 'unknown' } })

    expect(getMediaArticlesByType).toHaveBeenCalledWith('survey_report', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'type[equals]survey_report',
    })
  })

  it('指定されたタグが存在しない場合、タグフィルタは適用されない', async () => {
    vi.mocked(getTags)
      .mockResolvedValueOnce({ contents: [], totalCount: 0, offset: 0, limit: 1 }) // No tag found
      .mockResolvedValueOnce({ contents: mockTags, totalCount: 1, offset: 0, limit: 100 }) // For filters

    vi.mocked(getMediaArticlesByType).mockResolvedValue({
      contents: mockArticles,
      totalCount: 2,
      offset: 0,
      limit: 12,
    })
    vi.mocked(getCategories).mockResolvedValue({ contents: mockCategories, totalCount: 1, offset: 0, limit: 100 })

    await SurveyReportsPage({ searchParams: { tag: 'unknown' } })

    expect(getMediaArticlesByType).toHaveBeenCalledWith('survey_report', {
      limit: 12,
      offset: 0,
      orders: '-publishedAt',
      filters: 'type[equals]survey_report',
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

    const page = await SurveyReportsPage({ searchParams: {} })

    expect(page).toMatchSnapshot()
  })

  it('エラーが発生した場合、エラーをスローする', async () => {
    const error = new Error('API Error')
    vi.mocked(getMediaArticlesByType).mockRejectedValue(error)

    await expect(SurveyReportsPage({ searchParams: {} })).rejects.toThrow('API Error')
  })
})