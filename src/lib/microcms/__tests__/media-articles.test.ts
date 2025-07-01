/**
 * メディア記事APIメソッドのテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { client } from '../client'
import {
  getMediaArticlesList,
  getMediaArticleDetail,
  getMediaArticleBySlug,
  getAllMediaArticleIds,
  getAllMediaArticleSlugs,
  getMediaArticlesByCategory,
  getMediaArticlesByTag,
  getRelatedArticles,
} from '../media-articles'
import type { MediaArticle } from '@/lib/schema'

// clientのモック
vi.mock('../client', () => ({
  client: {
    getList: vi.fn(),
    get: vi.fn(),
  },
  defaultQueries: {
    limit: 100,
    orders: '-publishedAt',
  },
}))

/**
 * モック記事データを作成
 */
const createMockArticle = (
  overrides?: Partial<MediaArticle>
): MediaArticle => ({
  id: 'article-1',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  publishedAt: '2024-01-15T00:00:00.000Z',
  revisedAt: '2024-01-15T00:00:00.000Z',
  title: 'テスト記事',
  slug: 'test-article',
  type: 'article',
  membershipLevel: 'public',
  content: '<p>テスト内容</p>',
  heroImage: {
    url: 'https://example.com/image.jpg',
    height: 720,
    width: 1280,
  },
  ...overrides,
})

describe('media-articles API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMediaArticlesList', () => {
    it('記事一覧を取得できる', async () => {
      const mockResponse = {
        contents: [createMockArticle()],
        totalCount: 1,
        offset: 0,
        limit: 100,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      const result = await getMediaArticlesList()

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          limit: 100,
          orders: '-publishedAt',
        },
      })
      expect(result).toEqual(mockResponse)
    })

    it('カスタムクエリを適用できる', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 10,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      await getMediaArticlesList({ limit: 10, offset: 20 })

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          limit: 10,
          orders: '-publishedAt',
          offset: 20,
        },
      })
    })
  })

  describe('getMediaArticleDetail', () => {
    it('記事詳細を取得できる', async () => {
      const mockArticle = createMockArticle()
      vi.mocked(client.get).mockResolvedValueOnce(mockArticle)

      const result = await getMediaArticleDetail('article-1')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        contentId: 'article-1',
        queries: undefined,
      })
      expect(result).toEqual(mockArticle)
    })

    it('プレビュー用クエリを渡せる', async () => {
      const mockArticle = createMockArticle()
      vi.mocked(client.get).mockResolvedValueOnce(mockArticle)

      await getMediaArticleDetail('article-1', { draftKey: 'draft-key' })

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        contentId: 'article-1',
        queries: { draftKey: 'draft-key' },
      })
    })
  })

  describe('getMediaArticleBySlug', () => {
    it('スラッグから記事を取得できる', async () => {
      const mockArticle = createMockArticle()
      const mockResponse = {
        contents: [mockArticle],
        totalCount: 1,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      const result = await getMediaArticleBySlug('test-article')

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          filters: 'slug[equals]test-article',
          limit: 1,
        },
      })
      expect(result).toEqual(mockArticle)
    })

    it('記事が見つからない場合はnullを返す', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      const result = await getMediaArticleBySlug('not-found')

      expect(result).toBeNull()
    })
  })

  describe('getAllMediaArticleIds', () => {
    it('すべての記事IDを取得できる', async () => {
      const mockResponse1 = {
        contents: [
          {
            id: 'id-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'id-2',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalCount: 3,
        offset: 0,
        limit: 2,
      }
      const mockResponse2 = {
        contents: [
          {
            id: 'id-3',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalCount: 3,
        offset: 2,
        limit: 2,
      }

      vi.mocked(client.getList)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      const result = await getAllMediaArticleIds()

      expect(result).toEqual(['id-1', 'id-2', 'id-3'])
      expect(client.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('getAllMediaArticleSlugs', () => {
    it('すべての記事スラッグを取得できる', async () => {
      const mockResponse1 = {
        contents: [
          {
            id: 'id-1',
            slug: 'slug-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'id-2',
            slug: 'slug-2',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalCount: 3,
        offset: 0,
        limit: 2,
      }
      const mockResponse2 = {
        contents: [
          {
            id: 'id-3',
            slug: 'slug-3',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalCount: 3,
        offset: 2,
        limit: 2,
      }

      vi.mocked(client.getList)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      const result = await getAllMediaArticleSlugs()

      expect(result).toEqual(['slug-1', 'slug-2', 'slug-3'])
      expect(client.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('getMediaArticlesByCategory', () => {
    it('カテゴリ別の記事一覧を取得できる', async () => {
      const mockResponse = {
        contents: [createMockArticle()],
        totalCount: 1,
        offset: 0,
        limit: 100,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      const result = await getMediaArticlesByCategory('bitcoin')

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          filters: 'category.slug[equals]bitcoin',
          limit: 100,
          orders: '-publishedAt',
        },
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getMediaArticlesByTag', () => {
    it('タグ別の記事一覧を取得できる', async () => {
      const mockResponse = {
        contents: [createMockArticle()],
        totalCount: 1,
        offset: 0,
        limit: 100,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      const result = await getMediaArticlesByTag('crypto')

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          filters: 'tags[contains]crypto',
          limit: 100,
          orders: '-publishedAt',
        },
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getRelatedArticles', () => {
    it('同じカテゴリの関連記事を取得できる', async () => {
      const currentArticle = createMockArticle({
        id: 'current-article',
        category: {
          id: 'category-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          name: 'ビットコイン',
          slug: 'bitcoin',
        },
      })

      const mockResponse = {
        contents: [
          createMockArticle({ id: 'related-1' }),
          createMockArticle({ id: 'related-2' }),
          createMockArticle({ id: 'related-3' }),
        ],
        totalCount: 3,
        offset: 0,
        limit: 3,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      const result = await getRelatedArticles(currentArticle)

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          filters:
            'category.id[equals]category-1[and]id[not_equals]current-article',
          limit: 3,
          orders: '-publishedAt',
        },
      })
      expect(result).toHaveLength(3)
    })

    it('関連記事が少ない場合は最新記事で補完する', async () => {
      const currentArticle = createMockArticle({
        id: 'current-article',
        category: {
          id: 'category-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          name: 'ビットコイン',
          slug: 'bitcoin',
        },
      })

      const mockResponse1 = {
        contents: [createMockArticle({ id: 'related-1' })],
        totalCount: 1,
        offset: 0,
        limit: 3,
      }

      const mockResponse2 = {
        contents: [
          createMockArticle({ id: 'latest-1' }),
          createMockArticle({ id: 'latest-2' }),
        ],
        totalCount: 2,
        offset: 0,
        limit: 2,
      }

      vi.mocked(client.getList)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      const result = await getRelatedArticles(currentArticle)

      expect(result).toHaveLength(3)
      expect(client.getList).toHaveBeenCalledTimes(2)
    })

    it('カテゴリがない場合は最新記事を取得する', async () => {
      const currentArticle = createMockArticle({
        id: 'current-article',
        category: undefined,
      })

      const mockResponse = {
        contents: [
          createMockArticle({ id: 'latest-1' }),
          createMockArticle({ id: 'latest-2' }),
          createMockArticle({ id: 'latest-3' }),
        ],
        totalCount: 3,
        offset: 0,
        limit: 3,
      }

      vi.mocked(client.getList).mockResolvedValueOnce(mockResponse)

      const result = await getRelatedArticles(currentArticle)

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'media_articles',
        queries: {
          filters: 'id[not_equals]current-article',
          limit: 3,
          orders: '-publishedAt',
        },
      })
      expect(result).toHaveLength(3)
    })
  })
})
