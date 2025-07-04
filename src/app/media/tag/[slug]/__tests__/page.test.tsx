import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { notFound } from 'next/navigation'
import TagPage, { generateMetadata, generateStaticParams } from '../page'
import * as microCMS from '@/lib/microcms'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

// Mock microCMS functions
vi.mock('@/lib/microcms', () => ({
  getTags: vi.fn(),
  getTagBySlug: vi.fn(),
  getMediaArticlesByTag: vi.fn(),
}))

const mockTag = {
  id: 'tag1',
  name: 'ビットコイン',
  slug: 'bitcoin',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  publishedAt: '2024-01-01T00:00:00.000Z',
  revisedAt: '2024-01-01T00:00:00.000Z',
}

const mockTags = {
  contents: [
    mockTag,
    { ...mockTag, id: 'tag2', slug: 'ethereum', name: 'イーサリアム' },
  ],
  totalCount: 2,
  offset: 0,
  limit: 100,
}
vi.mocked(microCMS.getTags).mockResolvedValue(mockTags)

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

import type { MediaArticle } from '@/lib/schema/article.schema'

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

describe('TagPage', () => {
  const mockArticles = {
    contents: [
      {
        id: '1',
        title: 'Bitcoin Article',
        slug: 'bitcoin-article',
        type: 'article' as const,
        membershipLevel: 'public' as const,
        content: 'Content',
        heroImage: {
          url: 'https://example.com/image.jpg',
          height: 600,
          width: 800,
        },
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
    it('generates correct metadata for existing tag', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)

      const metadata = await generateMetadata({
        params: { slug: 'bitcoin' },
        searchParams: {},
      })

      expect(metadata.title).toBe('ビットコイン | Crypto Media')
      expect(metadata.description).toContain('ビットコイン')
      expect(metadata.openGraph?.title).toBe('ビットコイン | Crypto Media')
      expect(metadata.alternates?.canonical).toBe('/media/tag/bitcoin')
    })

    it('returns error metadata for non-existent tag', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(null)

      const metadata = await generateMetadata({
        params: { slug: 'non-existent' },
        searchParams: {},
      })

      expect(metadata.title).toBe('タグが見つかりません')
    })

    it('returns default metadata in CI environment', async () => {
      process.env.CI = 'true'

      const metadata = await generateMetadata({
        params: { slug: 'any-slug' },
        searchParams: {},
      })

      expect(metadata.title).toBe('Tag | Crypto Media')
      expect(microCMS.getTagBySlug).not.toHaveBeenCalled()
    })
  })

  describe('generateStaticParams', () => {
    it('returns all tag slugs', async () => {
      const params = await generateStaticParams()

      expect(params).toEqual([{ slug: 'bitcoin' }, { slug: 'ethereum' }])
    })

    it('returns empty array in CI environment', async () => {
      process.env.CI = 'true'

      const params = await generateStaticParams()

      expect(params).toEqual([])
      expect(microCMS.getTags).not.toHaveBeenCalled()
    })
  })

  describe('Page component', () => {
    it('renders tag page with articles', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)
      vi.mocked(microCMS.getMediaArticlesByTag).mockResolvedValue(mockArticles)

      const Component = await TagPage({
        params: { slug: 'bitcoin' },
        searchParams: {},
      })
      const { getByTestId, getByText } = render(Component)

      // Check breadcrumbs
      expect(getByTestId('breadcrumbs')).toBeInTheDocument()

      // Check page header
      expect(getByText('ビットコインの記事一覧')).toBeInTheDocument()
      expect(getByText('1件の記事が見つかりました')).toBeInTheDocument()

      // Check article grid
      const articleGrid = getByTestId('article-grid')
      expect(articleGrid).toBeInTheDocument()
      expect(getByText('Bitcoin Article')).toBeInTheDocument()

      // Check structured data
      const scriptTag = document.querySelector(
        'script[type="application/ld+json"]'
      )
      expect(scriptTag).toBeInTheDocument()
      if (scriptTag) {
        const jsonLd = JSON.parse(scriptTag.textContent || '{}')
        expect(jsonLd['@type']).toBe('CollectionPage')
        expect(jsonLd.name).toBe('ビットコインの記事一覧')
      }
    })

    it('calls notFound for non-existent tag', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(null)

      await TagPage({
        params: { slug: 'non-existent' },
        searchParams: {},
      })

      expect(notFound).toHaveBeenCalled()
    })

    it('shows pagination when more than 12 articles exist', async () => {
      const manyArticles = {
        ...mockArticles,
        totalCount: 25,
      }

      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)
      vi.mocked(microCMS.getMediaArticlesByTag).mockResolvedValue(manyArticles)

      const Component = await TagPage({
        params: { slug: 'bitcoin' },
        searchParams: {},
      })
      const { getByTestId } = render(Component)

      expect(getByTestId('pagination')).toBeInTheDocument()
      expect(getByTestId('pagination')).toHaveTextContent('Page 1 of 3') // 25/12 = 3 pages
    })

    it('handles page parameter correctly', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)
      vi.mocked(microCMS.getMediaArticlesByTag).mockResolvedValue(mockArticles)

      const Component = await TagPage({
        params: { slug: 'bitcoin' },
        searchParams: { page: '2' },
      })
      render(Component)

      expect(microCMS.getMediaArticlesByTag).toHaveBeenCalledWith('bitcoin', {
        limit: 12,
        offset: 12, // (2-1) * 12
        orders: '-publishedAt',
      })
    })

    it('does not show pagination for single page', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)
      vi.mocked(microCMS.getMediaArticlesByTag).mockResolvedValue(mockArticles)

      const Component = await TagPage({
        params: { slug: 'bitcoin' },
        searchParams: {},
      })
      const { queryByTestId } = render(Component)

      expect(queryByTestId('pagination')).not.toBeInTheDocument()
    })

    it('renders dummy page in CI environment', async () => {
      process.env.CI = 'true'

      const Component = await TagPage({
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
