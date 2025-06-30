/**
 * microCMS使用例のテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getArticles,
  getArticleBySlug,
  getArticlePreview,
  getPaidArticles,
  getOptimizedArticleImage,
  getSiteSettings,
} from '../example'
import { client } from '../client'

// clientのモック
vi.mock('../client', () => ({
  client: {
    get: vi.fn(),
  },
  defaultQueries: {
    limit: 100,
    orders: '-publishedAt',
  },
  getOptimizedImageUrl: vi.fn((url, options) => {
    const params = new URLSearchParams()
    if (options?.width) params.append('w', options.width.toString())
    if (options?.height) params.append('h', options.height.toString())
    if (options?.format) params.append('fm', options.format)
    if (options?.quality) params.append('q', options.quality.toString())
    return `${url}?${params.toString()}`
  }),
}))

describe('microCMS Example Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getArticles', () => {
    it('記事一覧を正常に取得できる', async () => {
      const mockResponse = {
        contents: [
          {
            id: 'article-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            title: 'テスト記事1',
            slug: 'test-article-1',
            type: 'article',
            membershipLevel: 'public',
            content: '記事の内容',
            heroImage: {
              url: 'https://images.microcms-assets.io/hero1.jpg',
              height: 720,
              width: 1280,
            },
          },
          {
            id: 'article-2',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            title: 'テスト記事2',
            slug: 'test-article-2',
            type: 'article',
            membershipLevel: 'paid',
            content: '記事の内容',
            heroImage: {
              url: 'https://images.microcms-assets.io/hero2.jpg',
              height: 720,
              width: 1280,
            },
          },
        ],
        totalCount: 2,
        offset: 0,
        limit: 10,
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getArticles()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          limit: 10,
          orders: '-publishedAt',
        },
      })
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('テスト記事1')
      expect(result[1].title).toBe('テスト記事2')
    })

    it('カスタムlimitを指定できる', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 20,
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      await getArticles(20)

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          limit: 20,
          orders: '-publishedAt',
        },
      })
    })

    it('APIエラーの場合は例外をスローする', async () => {
      const error = new Error('API Error')
      vi.mocked(client.get).mockRejectedValueOnce(error)

      await expect(getArticles()).rejects.toThrow('API Error')
    })

    it('バリデーションエラーの場合は例外をスローする', async () => {
      const invalidResponse = {
        contents: [
          {
            id: 'article-1',
            // 必須フィールドが欠けている
            title: 'テスト記事',
          },
        ],
        totalCount: 1,
        offset: 0,
        limit: 10,
      }

      vi.mocked(client.get).mockResolvedValueOnce(invalidResponse)

      await expect(getArticles()).rejects.toThrow()
    })
  })

  describe('getArticleBySlug', () => {
    it('slugで記事を正常に取得できる', async () => {
      const mockResponse = {
        contents: [
          {
            id: 'article-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            title: 'テスト記事',
            slug: 'test-article',
            type: 'article',
            membershipLevel: 'public',
            content: '記事の内容',
            heroImage: {
              url: 'https://images.microcms-assets.io/hero.jpg',
              height: 720,
              width: 1280,
            },
          },
        ],
        totalCount: 1,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getArticleBySlug('test-article')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          filters: 'slug[equals]test-article',
          limit: 1,
        },
      })
      expect(result).not.toBeNull()
      expect(result?.slug).toBe('test-article')
    })

    it('記事が見つからない場合はnullを返す', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getArticleBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('複数の記事が見つかった場合は警告を出力する', async () => {
      const mockResponse = {
        contents: [
          {
            id: 'article-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            title: 'テスト記事1',
            slug: 'test-article',
            type: 'article',
            membershipLevel: 'public',
            content: '記事の内容',
            heroImage: {
              url: 'https://images.microcms-assets.io/hero.jpg',
              height: 720,
              width: 1280,
            },
          },
          {
            id: 'article-2',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            title: 'テスト記事2',
            slug: 'test-article',
            type: 'article',
            membershipLevel: 'public',
            content: '記事の内容',
            heroImage: {
              url: 'https://images.microcms-assets.io/hero.jpg',
              height: 720,
              width: 1280,
            },
          },
        ],
        totalCount: 2,
        offset: 0,
        limit: 1,
      }

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getArticleBySlug('test-article')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Expected 1 article with slug "test-article", but found 2'
      )
      expect(result).not.toBeNull()
      expect(result?.id).toBe('article-1')

      consoleWarnSpy.mockRestore()
    })

    it('404エラーの場合はnullを返す', async () => {
      const error = new Error('Not Found') as Error & { response?: { status: number } }
      error.response = { status: 404 }
      vi.mocked(client.get).mockRejectedValueOnce(error)

      const result = await getArticleBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('その他のエラーの場合は例外をスローする', async () => {
      const error = new Error('Server Error')
      vi.mocked(client.get).mockRejectedValueOnce(error)

      await expect(getArticleBySlug('test')).rejects.toThrow('Server Error')
    })
  })

  describe('getArticlePreview', () => {
    it('プレビュー記事を正常に取得できる', async () => {
      const mockResponse = {
        id: 'article-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'プレビュー記事',
        slug: 'preview-article',
        type: 'article',
        membershipLevel: 'public',
        content: '記事の内容',
        heroImage: {
          url: 'https://images.microcms-assets.io/hero.jpg',
          height: 720,
          width: 1280,
        },
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getArticlePreview('article-1', 'draft-key-123')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        contentId: 'article-1',
        queries: {
          draftKey: 'draft-key-123',
        },
      })
      expect(result.title).toBe('プレビュー記事')
    })

    it('APIエラーの場合は例外をスローする', async () => {
      const error = new Error('Preview Error')
      vi.mocked(client.get).mockRejectedValueOnce(error)

      await expect(getArticlePreview('article-1', 'draft-key')).rejects.toThrow('Preview Error')
    })
  })

  describe('getPaidArticles', () => {
    it('有料記事のみを取得できる', async () => {
      const mockResponse = {
        contents: [
          {
            id: 'article-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            title: '有料記事',
            slug: 'paid-article',
            type: 'article',
            membershipLevel: 'paid',
            content: '記事の内容',
            heroImage: {
              url: 'https://images.microcms-assets.io/hero.jpg',
              height: 720,
              width: 1280,
            },
          },
        ],
        totalCount: 1,
        offset: 0,
        limit: 100,
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getPaidArticles()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          limit: 100,
          orders: '-publishedAt',
          filters: 'membershipLevel[equals]paid',
        },
      })
      expect(result).toHaveLength(1)
      expect(result[0].membershipLevel).toBe('paid')
    })

    it('APIエラーの場合は例外をスローする', async () => {
      const error = new Error('Failed to fetch paid articles')
      vi.mocked(client.get).mockRejectedValueOnce(error)

      await expect(getPaidArticles()).rejects.toThrow('Failed to fetch paid articles')
    })
  })

  describe('getOptimizedArticleImage', () => {
    it('画像URLを最適化できる', () => {
      const article = {
        id: 'article-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'テスト記事',
        slug: 'test-article',
        type: 'article' as const,
        membershipLevel: 'public' as const,
        content: '記事の内容',
        heroImage: {
          url: 'https://images.microcms-assets.io/hero.jpg',
          height: 720,
          width: 1280,
        },
      }

      const result = getOptimizedArticleImage(article)

      expect(result).toEqual({
        desktop: 'https://images.microcms-assets.io/hero.jpg?w=1200&fm=webp&q=85',
        mobile: 'https://images.microcms-assets.io/hero.jpg?w=600&fm=webp&q=85',
        ogp: 'https://images.microcms-assets.io/hero.jpg?w=1200&h=630&fm=jpg&q=90',
      })
    })

    it('heroImageがない場合はnullを返す', () => {
      const article = {
        id: 'article-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'テスト記事',
        slug: 'test-article',
        type: 'article' as const,
        membershipLevel: 'public' as const,
        content: '記事の内容',
        heroImage: undefined,
      }

      const result = getOptimizedArticleImage(article as unknown as Parameters<typeof getOptimizedArticleImage>[0])

      expect(result).toBeNull()
    })
  })

  describe('getSiteSettings', () => {
    it('サイト設定を正常に取得できる', async () => {
      const mockResponse = {
        id: 'settings',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        site_title: 'Crypto Media',
        site_description: '暗号資産メディア',
        default_og_image: {
          url: 'https://images.microcms-assets.io/og.jpg',
          height: 630,
          width: 1200,
        },
        google_analytics_id: 'GA-123456789',
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getSiteSettings()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'site_settings',
      })
      expect(result.site_title).toBe('Crypto Media')
      expect(result.site_description).toBe('暗号資産メディア')
    })

    it('APIエラーの場合は例外をスローする', async () => {
      const error = new Error('Settings Error')
      vi.mocked(client.get).mockRejectedValueOnce(error)

      await expect(getSiteSettings()).rejects.toThrow('Settings Error')
    })
  })
})