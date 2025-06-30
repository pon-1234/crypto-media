import { describe, it, expect, vi, beforeEach } from 'vitest'
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

// Mock components
vi.mock('@/components/ui/Breadcrumbs', () => ({
  Breadcrumbs: ({ items }: { items: Array<{ label: string; href?: string }> }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item, index) => (
        <span key={index}>{item.label}</span>
      ))}
    </nav>
  ),
}))

vi.mock('@/components/media/ArticleGrid', () => ({
  ArticleGrid: ({ articles }: { articles: any[] }) => (
    <div data-testid="article-grid">
      {articles.map((article) => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  ),
}))

describe('TagPage', () => {
  const mockTag = {
    id: 'tag1',
    name: 'ビットコイン',
    slug: 'bitcoin',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
  }

  const mockArticles = {
    contents: [
      {
        id: '1',
        title: 'Bitcoin Article',
        slug: 'bitcoin-article',
        type: 'article' as const,
        membershipLevel: 'public' as const,
        content: 'Content',
        heroImage: { url: 'https://example.com/image.jpg', height: 600, width: 800 },
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
  })

  describe('generateMetadata', () => {
    it('generates correct metadata for existing tag', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)

      const metadata = await generateMetadata({ params: { slug: 'bitcoin' } })

      expect(metadata.title).toBe('ビットコイン | Crypto Media')
      expect(metadata.description).toContain('ビットコイン')
      expect(metadata.openGraph?.title).toBe('ビットコイン | Crypto Media')
      expect(metadata.alternates?.canonical).toBe('/media/tag/bitcoin')
    })

    it('returns error metadata for non-existent tag', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(null)

      const metadata = await generateMetadata({ params: { slug: 'non-existent' } })

      expect(metadata.title).toBe('タグが見つかりません')
    })
  })

  describe('generateStaticParams', () => {
    it('returns all tag slugs', async () => {
      const mockTags = {
        contents: [
          { ...mockTag, slug: 'bitcoin' },
          { ...mockTag, slug: 'ethereum', name: 'イーサリアム' },
        ],
        totalCount: 2,
        offset: 0,
        limit: 100,
      }

      vi.mocked(microCMS.getTags).mockResolvedValue(mockTags)

      const params = await generateStaticParams()

      expect(params).toEqual([
        { slug: 'bitcoin' },
        { slug: 'ethereum' },
      ])
    })
  })

  describe('Page component', () => {
    it('renders tag page with articles', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)
      vi.mocked(microCMS.getMediaArticlesByTag).mockResolvedValue(mockArticles)

      const Component = await TagPage({ params: { slug: 'bitcoin' } })
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
      const scriptTag = document.querySelector('script[type="application/ld+json"]')
      expect(scriptTag).toBeInTheDocument()
      if (scriptTag) {
        const jsonLd = JSON.parse(scriptTag.textContent || '{}')
        expect(jsonLd['@type']).toBe('CollectionPage')
        expect(jsonLd.name).toBe('ビットコインの記事一覧')
      }
    })

    it('calls notFound for non-existent tag', async () => {
      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(null)

      await TagPage({ params: { slug: 'non-existent' } })

      expect(notFound).toHaveBeenCalled()
    })

    it('shows pagination hint when more articles exist', async () => {
      const manyArticles = {
        ...mockArticles,
        totalCount: 25,
      }

      vi.mocked(microCMS.getTagBySlug).mockResolvedValue(mockTag)
      vi.mocked(microCMS.getMediaArticlesByTag).mockResolvedValue(manyArticles)

      const Component = await TagPage({ params: { slug: 'bitcoin' } })
      const { getByText } = render(Component)

      expect(getByText('さらに記事を読み込む機能は準備中です')).toBeInTheDocument()
    })
  })
})