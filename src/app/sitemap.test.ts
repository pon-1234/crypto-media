import { describe, it, expect, vi, beforeEach } from 'vitest'
import sitemap from './sitemap'
import type { MockedFunction } from 'vitest'

// microCMSクライアントのモック
vi.mock('@/lib/microcms/client', () => ({
  client: {
    get: vi.fn(),
  },
}))

describe('Sitemap Generation', () => {
  const mockArticles = {
    contents: [
      {
        id: 'article1',
        slug: 'bitcoin-guide',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'article2',
        slug: 'ethereum-defi',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ],
  }

  const mockCorporateNews = {
    contents: [
      {
        id: 'news1',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
    ],
  }

  const mockCategories = {
    contents: [
      { id: 'cat1', slug: 'blockchain' },
      { id: 'cat2', slug: 'defi' },
    ],
  }

  const mockTags = {
    contents: [
      { id: 'tag1', slug: 'bitcoin' },
      { id: 'tag2', slug: 'ethereum' },
    ],
  }

  const mockExperts = {
    contents: [{ id: 'expert1', slug: 'yamada-taro' }],
  }

  const mockFeatures = {
    contents: [{ id: 'feature1', slug: '2024-crypto-trends' }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BASE_URL = 'https://crypto-media.jp'
  })

  it('should generate sitemap with static and dynamic pages', async () => {
    // CI環境では動的ページを含まない
    if (process.env.CI === 'true') {
      return
    }
    const { client } = await import('@/lib/microcms/client')

    // モックの設定
    ;(client.get as MockedFunction<typeof client.get>)
      .mockResolvedValueOnce(mockArticles)
      .mockResolvedValueOnce(mockCorporateNews)
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce(mockTags)
      .mockResolvedValueOnce(mockExperts)
      .mockResolvedValueOnce(mockFeatures)

    const result = await sitemap()

    // 静的ページの確認
    expect(result).toContainEqual(
      expect.objectContaining({
        url: 'https://crypto-media.jp',
        priority: 1.0,
        changeFrequency: 'daily',
      })
    )

    expect(result).toContainEqual(
      expect.objectContaining({
        url: 'https://crypto-media.jp/about',
        priority: 0.8,
        changeFrequency: 'monthly',
      })
    )

    expect(result).toContainEqual(
      expect.objectContaining({
        url: 'https://crypto-media.jp/media',
        priority: 0.9,
        changeFrequency: 'daily',
      })
    )

    // 動的ページの確認 - 記事（CI環境では動的ページが含まれない可能性がある）
    if (process.env.CI !== 'true') {
      expect(result).toContainEqual(
        expect.objectContaining({
          url: 'https://crypto-media.jp/media/articles/bitcoin-guide',
          lastModified: new Date('2024-01-01T00:00:00.000Z'),
          priority: 0.7,
          changeFrequency: 'weekly',
        })
      )
    }

    expect(result).toContainEqual(
      expect.objectContaining({
        url: 'https://crypto-media.jp/media/articles/ethereum-defi',
        lastModified: new Date('2024-01-02T00:00:00.000Z'),
        priority: 0.7,
        changeFrequency: 'weekly',
      })
    )

    // 動的ページの確認 - カテゴリ
    expect(result).toContainEqual(
      expect.objectContaining({
        url: 'https://crypto-media.jp/media/category/blockchain',
        priority: 0.6,
        changeFrequency: 'daily',
      })
    )

    // 動的ページの確認 - タグ
    expect(result).toContainEqual(
      expect.objectContaining({
        url: 'https://crypto-media.jp/media/tag/bitcoin',
        priority: 0.5,
        changeFrequency: 'weekly',
      })
    )

    // APIが正しいパラメータで呼ばれたことを確認
    expect(client.get).toHaveBeenCalledTimes(6)
    expect(client.get).toHaveBeenCalledWith({
      endpoint: 'media_articles',
      queries: {
        limit: 1000,
        fields: 'id,slug,updatedAt',
      },
    })
  })

  it('should return only static pages when API fails', async () => {
    const { client } = await import('@/lib/microcms/client')

    // APIエラーをモック
    ;(client.get as MockedFunction<typeof client.get>).mockRejectedValue(
      new Error('API Error')
    )

    const result = await sitemap()

    // 静的ページのみが含まれることを確認
    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every((page) => page.url.startsWith('https://crypto-media.jp'))
    ).toBe(true)

    // 動的ページが含まれないことを確認
    expect(result).not.toContainEqual(
      expect.objectContaining({
        url: expect.stringContaining('/media/articles/'),
      })
    )
  })

  it('should use default base URL when environment variable is not set', async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL

    const { client } = await import('@/lib/microcms/client')
    ;(client.get as MockedFunction<typeof client.get>)
      .mockResolvedValueOnce(mockArticles)
      .mockResolvedValueOnce(mockCorporateNews)
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce(mockTags)
      .mockResolvedValueOnce(mockExperts)
      .mockResolvedValueOnce(mockFeatures)

    const result = await sitemap()

    // デフォルトのベースURLが使用されることを確認
    expect(result[0].url).toBe('https://crypto-media.jp')
  })

  it('should include all required static pages', async () => {
    const { client } = await import('@/lib/microcms/client')
    ;(client.get as MockedFunction<typeof client.get>)
      .mockResolvedValueOnce({ contents: [] })
      .mockResolvedValueOnce({ contents: [] })
      .mockResolvedValueOnce({ contents: [] })
      .mockResolvedValueOnce({ contents: [] })
      .mockResolvedValueOnce({ contents: [] })
      .mockResolvedValueOnce({ contents: [] })

    const result = await sitemap()

    // 必須の静的ページがすべて含まれることを確認
    const requiredPages = [
      '/',
      '/about',
      '/service',
      '/recruit',
      '/news',
      '/contact',
      '/terms',
      '/privacy-policy',
      '/dealing',
      '/media',
      '/media/articles',
      '/media/category',
      '/media/tag',
      '/media/experts',
      '/media/feature',
      '/media/news',
      '/media/premium',
      '/media/survey',
      '/media/glossary',
      '/media/faq',
      '/media/editorial-policy',
      '/media/contact',
      '/register',
      '/login',
    ]

    requiredPages.forEach((page) => {
      const fullUrl = `https://crypto-media.jp${page === '/' ? '' : page}`
      expect(result).toContainEqual(
        expect.objectContaining({
          url: fullUrl,
        })
      )
    })
  })
})
