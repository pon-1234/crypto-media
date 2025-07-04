import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { notFound } from 'next/navigation'
import CategoryPage, { generateMetadata, generateStaticParams } from '../page'
import * as microCMS from '@/lib/microcms'
import type {
  Category,
  MediaArticle,
  MicroCMSListResponse,
  MicroCMSImage,
} from '@/lib/microcms'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

// Mock microCMS functions
vi.mock('@/lib/microcms', () => ({
  getCategories: vi.fn(),
  getCategoryBySlug: vi.fn(),
  getMediaArticlesByCategory: vi.fn(),
}))

const mockCategory: Category = {
  id: 'cat1',
  name: 'ブロックチェーン',
  slug: 'blockchain',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  publishedAt: '2024-01-01T00:00:00.000Z',
  revisedAt: '2024-01-01T00:00:00.000Z',
}

const mockCategories: MicroCMSListResponse<Category> = {
  contents: [
    mockCategory,
    { ...mockCategory, id: 'cat2', slug: 'defi', name: 'DeFi' },
  ],
  totalCount: 2,
  offset: 0,
  limit: 100,
}
vi.mocked(microCMS.getCategories).mockResolvedValue(mockCategories)

// Store original CI env
const originalCI = process.env.CI

// Mock components
vi.mock('@/components/ui/Breadcrumbs', () => ({
  Breadcrumbs: ({
    items,
  }: {
    items: Array<{ label: string; href?: string }>
  }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item, index) => (
        <span key={index}>{item.label}</span>
      ))}
    </nav>
  ),
}))

vi.mock('@/components/media/ArticleGrid', () => ({
  ArticleGrid: ({ articles }: { articles: MediaArticle[] }) => (
    <div data-testid="article-grid">
      {articles.map((article) => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
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

describe('CategoryPage', () => {
  const mockArticles: MicroCMSListResponse<MediaArticle> = {
    contents: [
      {
        id: '1',
        title: 'Test Article 1',
        slug: 'test-article-1',
        type: 'article',
        membershipLevel: 'public',
        content: 'Content',
        heroImage: {
          url: 'https://example.com/image.jpg',
          height: 600,
          width: 800,
        } as MicroCMSImage,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        publishedAt: '2024-01-01T00:00:00.000Z',
        revisedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    totalCount: 1,
    offset: 0,
    limit: 20,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Disable CI mode for tests
    process.env.CI = undefined
  })

  afterEach(() => {
    // Restore original CI env
    process.env.CI = originalCI
  })

  describe('generateMetadata', () => {
    it('generates correct metadata for existing category', async () => {
      vi.mocked(microCMS.getCategoryBySlug).mockResolvedValue(mockCategory)

      const metadata = await generateMetadata({
        params: { slug: 'blockchain' },
      })

      expect(metadata.title).toBe('ブロックチェーン | Crypto Media')
      expect(metadata.description).toContain('ブロックチェーン')
      expect(metadata.openGraph?.title).toBe('ブロックチェーン | Crypto Media')
      expect(metadata.alternates?.canonical).toBe('/media/category/blockchain')
    })

    it('returns error metadata for non-existent category', async () => {
      vi.mocked(microCMS.getCategoryBySlug).mockResolvedValue(null)

      const metadata = await generateMetadata({
        params: { slug: 'non-existent' },
      })

      expect(metadata.title).toBe('カテゴリが見つかりません')
    })

    it('returns default metadata in CI environment', async () => {
      process.env.CI = 'true'

      const metadata = await generateMetadata({
        params: { slug: 'any-slug' },
      })

      expect(metadata.title).toBe('Category | Crypto Media')
      expect(microCMS.getCategoryBySlug).not.toHaveBeenCalled()
    })
  })

  describe('generateStaticParams', () => {
    it('returns all category slugs', async () => {
      const params = await generateStaticParams()

      expect(params).toEqual([{ slug: 'blockchain' }, { slug: 'defi' }])
    })

    it('returns empty array in CI environment', async () => {
      process.env.CI = 'true'

      const params = await generateStaticParams()

      expect(params).toEqual([])
      expect(microCMS.getCategories).not.toHaveBeenCalled()
    })
  })

  describe('Page component', () => {
    it('renders category page with articles', async () => {
      vi.mocked(microCMS.getCategoryBySlug).mockResolvedValue(mockCategory)
      vi.mocked(microCMS.getMediaArticlesByCategory).mockResolvedValue(
        mockArticles
      )

      const Component = await CategoryPage({
        params: { slug: 'blockchain' },
        searchParams: {},
      })
      const { getByTestId, getByText } = render(Component)

      // Check breadcrumbs
      expect(getByTestId('breadcrumbs')).toBeInTheDocument()

      // Check page header
      expect(getByText('ブロックチェーンの記事一覧')).toBeInTheDocument()
      expect(getByText('1件の記事が見つかりました')).toBeInTheDocument()

      // Check article grid
      const articleGrid = getByTestId('article-grid')
      expect(articleGrid).toBeInTheDocument()
      expect(getByText('Test Article 1')).toBeInTheDocument()

      // Check structured data
      const scriptTag = document.querySelector(
        'script[type="application/ld+json"]'
      )
      expect(scriptTag).toBeInTheDocument()
      if (scriptTag) {
        const jsonLd = JSON.parse(scriptTag.textContent || '{}') as Record<
          string,
          unknown
        >
        expect(jsonLd['@type']).toBe('CollectionPage')
        expect(jsonLd.name).toBe('ブロックチェーンの記事一覧')
      }
    })

    it('calls notFound for non-existent category', async () => {
      vi.mocked(microCMS.getCategoryBySlug).mockResolvedValue(null)

      await CategoryPage({
        params: { slug: 'non-existent' },
        searchParams: {},
      })

      expect(notFound).toHaveBeenCalled()
    })

    it('shows pagination when more than 12 articles exist', async () => {
      const manyArticles: MicroCMSListResponse<MediaArticle> = {
        ...mockArticles,
        totalCount: 25,
      }

      vi.mocked(microCMS.getCategoryBySlug).mockResolvedValue(mockCategory)
      vi.mocked(microCMS.getMediaArticlesByCategory).mockResolvedValue(
        manyArticles
      )

      const Component = await CategoryPage({
        params: { slug: 'blockchain' },
        searchParams: {},
      })
      const { getByTestId } = render(Component)

      expect(getByTestId('pagination')).toBeInTheDocument()
      expect(getByTestId('pagination')).toHaveTextContent('Page 1 of 3') // 25/12 = 3 pages
    })

    it('handles page parameter correctly', async () => {
      vi.mocked(microCMS.getCategoryBySlug).mockResolvedValue(mockCategory)
      vi.mocked(microCMS.getMediaArticlesByCategory).mockResolvedValue(
        mockArticles
      )

      const Component = await CategoryPage({
        params: { slug: 'blockchain' },
        searchParams: { page: '2' },
      })
      render(Component)

      expect(microCMS.getMediaArticlesByCategory).toHaveBeenCalledWith(
        'blockchain',
        {
          limit: 12,
          offset: 12, // (2-1) * 12
          orders: '-publishedAt',
        }
      )
    })

    it('does not show pagination for single page', async () => {
      vi.mocked(microCMS.getCategoryBySlug).mockResolvedValue(mockCategory)
      vi.mocked(microCMS.getMediaArticlesByCategory).mockResolvedValue(
        mockArticles
      )

      const Component = await CategoryPage({
        params: { slug: 'blockchain' },
        searchParams: {},
      })
      const { queryByTestId } = render(Component)

      expect(queryByTestId('pagination')).not.toBeInTheDocument()
    })

    it('renders dummy page in CI environment', async () => {
      process.env.CI = 'true'

      const Component = await CategoryPage({
        params: { slug: 'any-slug' },
        searchParams: {},
      })
      const { getByText } = render(Component)

      expect(
        getByText('CI環境でのビルド用ダミーページです。')
      ).toBeInTheDocument()
    })
  })
})
