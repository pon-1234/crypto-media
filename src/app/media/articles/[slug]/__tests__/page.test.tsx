/**
 * メディア記事詳細ページのテスト
 * @doc DEVELOPMENT_GUIDE.md#メディア記事詳細
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { notFound } from 'next/navigation'
import MediaArticleDetailPage, {
  generateMetadata,
  generateStaticParams,
} from '../page'
import type { MediaArticle } from '@/lib/schema'

// Next.jsのnotFoundをモック
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

// microCMS APIのモック
vi.mock('@/lib/microcms', () => ({
  getMediaArticleBySlug: vi.fn(),
  getAllMediaArticleSlugs: vi.fn(),
  getRelatedArticles: vi.fn(),
  getOptimizedImageUrl: vi.fn((url: string) => url),
}))

// DOMPurifyのモック
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string, options?: { ALLOWED_TAGS?: string[] }) => {
      // ALLOWED_TAGSが空の場合はテキストのみを返す
      if (options?.ALLOWED_TAGS && options.ALLOWED_TAGS.length === 0) {
        return html.replace(/<[^>]*>/g, '')
      }
      return html
    }),
  },
}))

// date-fnsのモック
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2024年01月15日'),
}))

// date-fns/localeのモック
vi.mock('date-fns/locale', () => ({
  ja: {},
}))

// import後にモックを取得
import {
  getMediaArticleBySlug,
  getAllMediaArticleSlugs,
  getRelatedArticles,
} from '@/lib/microcms'

/**
 * テスト用の記事データを作成
 */
const createMockArticle = (
  overrides?: Partial<MediaArticle>
): MediaArticle => ({
  id: 'test-article-1',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  publishedAt: '2024-01-15T00:00:00.000Z',
  revisedAt: '2024-01-15T00:00:00.000Z',
  title: 'テスト記事タイトル',
  slug: 'test-article',
  type: 'article',
  membershipLevel: 'public',
  content: '<p>テスト記事の内容</p>',
  heroImage: {
    url: 'https://example.com/image.jpg',
    height: 720,
    width: 1280,
  },
  category: {
    id: 'category-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
    name: 'ビットコイン',
    slug: 'bitcoin',
  },
  tags: [
    {
      id: 'tag-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
      name: '暗号資産',
      slug: 'crypto',
    },
  ],
  author: {
    id: 'author-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
    name: '田中太郎',
    slug: 'tanaka-taro',
    role: ['執筆者'],
    profile: '<p>暗号資産専門ライター</p>',
    avatar: {
      url: 'https://example.com/avatar.jpg',
      height: 100,
      width: 100,
    },
  },
  ...overrides,
})

describe('MediaArticleDetailPage', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // CI環境フラグをfalseに設定してテスト実行
    process.env = { ...originalEnv, CI: 'false' }
  })
  
  afterEach(() => {
    process.env = originalEnv
  })

  describe('ページコンポーネント', () => {
    it('記事詳細を正しく表示する', async () => {
      const mockArticle = createMockArticle()
      const mockRelatedArticles = [
        createMockArticle({ id: 'related-1', title: '関連記事1' }),
        createMockArticle({ id: 'related-2', title: '関連記事2' }),
      ]

      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(mockArticle)
      vi.mocked(getRelatedArticles).mockResolvedValueOnce(mockRelatedArticles)

      const Page = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })
      render(Page)

      // タイトルが表示される
      expect(
        screen.getByRole('heading', { name: 'テスト記事タイトル' })
      ).toBeInTheDocument()

      // 記事内容が表示される
      expect(screen.getByText('テスト記事の内容')).toBeInTheDocument()

      // 執筆者情報が表示される
      expect(screen.getByText('執筆者')).toBeInTheDocument()
      expect(screen.getAllByText('田中太郎')[0]).toBeInTheDocument()

      // カテゴリが表示される（サイドバーのカテゴリリンク）
      expect(
        screen.getByRole('link', { name: 'ビットコイン' })
      ).toBeInTheDocument()

      // タグが表示される（詳細ページのタグリンク）
      expect(
        screen.getByRole('link', { name: '#暗号資産' })
      ).toBeInTheDocument()

      // 関連記事が表示される
      expect(screen.getByText('関連記事1')).toBeInTheDocument()
      expect(screen.getByText('関連記事2')).toBeInTheDocument()

      // 構造化データが含まれる
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      )
      expect(scripts).toHaveLength(1)
    })

    it('有料記事の場合、ペイウォールラベルを表示する', async () => {
      const mockArticle = createMockArticle({
        membershipLevel: 'paid',
      })

      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(mockArticle)
      vi.mocked(getRelatedArticles).mockResolvedValueOnce([])

      const Page = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })
      render(Page)

      expect(screen.getByText('有料会員限定')).toBeInTheDocument()
    })

    it('特集がある記事の場合、関連特集を表示する', async () => {
      const mockArticle = createMockArticle({
        features: [
          {
            id: 'feature-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            publishedAt: '2024-01-01T00:00:00.000Z',
            revisedAt: '2024-01-01T00:00:00.000Z',
            name: '2024年の暗号資産トレンド',
            slug: '2024-crypto-trends',
            description: '2024年の暗号資産市場の動向を解説',
            heroImage: {
              url: 'https://example.com/feature.jpg',
              height: 720,
              width: 1280,
            },
          },
        ],
      })

      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(mockArticle)
      vi.mocked(getRelatedArticles).mockResolvedValueOnce([])

      const Page = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })
      render(Page)

      expect(screen.getByText('関連特集')).toBeInTheDocument()
      expect(screen.getByText('2024年の暗号資産トレンド')).toBeInTheDocument()
    })

    it('調査レポートタイプの記事を正しく表示する', async () => {
      const mockArticle = createMockArticle({
        type: 'survey_report',
      })

      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(mockArticle)
      vi.mocked(getRelatedArticles).mockResolvedValueOnce([])

      const Page = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })
      render(Page)

      expect(screen.getByText('調査レポート')).toBeInTheDocument()
    })

    it('メディアお知らせタイプの記事を正しく表示する', async () => {
      const mockArticle = createMockArticle({
        type: 'media_news',
      })

      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(mockArticle)
      vi.mocked(getRelatedArticles).mockResolvedValueOnce([])

      const Page = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })
      render(Page)

      expect(screen.getByText('お知らせ')).toBeInTheDocument()
    })

    it('記事が見つからない場合はnotFoundを呼ぶ', async () => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(null)

      try {
        await MediaArticleDetailPage({ params: { slug: 'not-found' } })
      } catch {
        // notFoundはエラーをスローするため、catch内で確認
      }

      expect(notFound).toHaveBeenCalled()
    })

    it('APIエラーの場合はエラーをスローする', async () => {
      const mockError = new Error('API Error')
      vi.mocked(getMediaArticleBySlug).mockRejectedValueOnce(mockError)

      await expect(
        MediaArticleDetailPage({ params: { slug: 'test-article' } })
      ).rejects.toThrow('API Error')
    })
  })

  describe('generateMetadata', () => {
    it('記事が存在する場合、適切なメタデータを生成する', async () => {
      const mockArticle = createMockArticle()
      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(mockArticle)

      const metadata = await generateMetadata({
        params: { slug: 'test-article' },
      })

      expect(metadata.title).toBe('テスト記事タイトル | Crypto Media')
      expect(metadata.description).toBe('テスト記事の内容')
      expect(metadata.openGraph?.title).toBe(
        'テスト記事タイトル | Crypto Media'
      )
      const images = metadata.openGraph?.images
      expect(images && Array.isArray(images) && images[0]).toEqual({
        url: 'https://example.com/image.jpg',
        width: 1280,
        height: 720,
        alt: 'テスト記事タイトル',
      })
    })

    it('記事が存在しない場合、デフォルトのメタデータを返す', async () => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValueOnce(null)

      const metadata = await generateMetadata({ params: { slug: 'not-found' } })

      expect(metadata.title).toBe('記事が見つかりません | Crypto Media')
    })
  })

  describe('generateStaticParams', () => {
    it('すべての記事スラッグを返す', async () => {
      const mockSlugs = ['article-1', 'article-2', 'article-3']
      vi.mocked(getAllMediaArticleSlugs).mockResolvedValueOnce(mockSlugs)

      const params = await generateStaticParams()

      expect(params).toEqual([
        { slug: 'article-1' },
        { slug: 'article-2' },
        { slug: 'article-3' },
      ])
    })
  })
})
