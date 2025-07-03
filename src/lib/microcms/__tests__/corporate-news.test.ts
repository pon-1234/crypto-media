/**
 * コーポレートニュースAPIメソッドのテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { client } from '../client'
import {
  getCorporateNewsList,
  getCorporateNewsDetail,
  getAllCorporateNewsIds,
  getCorporateNewsListByCategory,
} from '../corporate-news'
import type { CorporateNews } from '@/lib/schema'

// clientのモック
vi.mock('../client', () => ({
  client: {
    get: vi.fn(),
  },
}))

// handleErrorのモック
vi.mock('@/lib/utils/handleError', () => ({
  handleError: vi.fn(),
}))

const createMockNews = (overrides?: Partial<CorporateNews>): CorporateNews => ({
  id: 'news-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  publishedAt: '2024-01-01T00:00:00.000Z',
  revisedAt: '2024-01-01T00:00:00.000Z',
  title: 'テストお知らせ',
  content: '<p>テスト内容</p>',
  ...overrides,
})

describe('corporate-news API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCorporateNewsList', () => {
    it('お知らせ一覧を取得できる', async () => {
      const mockResponse = {
        contents: [createMockNews()],
        totalCount: 1,
        offset: 0,
        limit: 10,
      }
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getCorporateNewsList()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        queries: undefined,
      })
      expect(result).toEqual(mockResponse)
    })

    it('APIエラー時にエラーをスローする', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error('API Error'))
      await expect(getCorporateNewsList()).rejects.toThrow('API Error')
    })
  })

  describe('getCorporateNewsDetail', () => {
    it('お知らせ詳細を取得できる', async () => {
      const mockNews = createMockNews()
      vi.mocked(client.get).mockResolvedValueOnce(mockNews)

      const result = await getCorporateNewsDetail('news-1')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        contentId: 'news-1',
        queries: undefined,
      })
      expect(result).toEqual(mockNews)
    })

    it('APIエラー時にエラーをスローする', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error('API Error'))
      await expect(getCorporateNewsDetail('news-1')).rejects.toThrow(
        'API Error'
      )
    })
  })

  describe('getAllCorporateNewsIds', () => {
    it('すべてのお知らせIDを取得できる', async () => {
      const mockResponse = {
        contents: [{ id: 'id-1' }, { id: 'id-2' }],
      }
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getAllCorporateNewsIds()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        queries: { fields: 'id', limit: 100 },
      })
      expect(result).toEqual(['id-1', 'id-2'])
    })

    it('APIエラー時にエラーをスローする', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error('API Error'))
      await expect(getAllCorporateNewsIds()).rejects.toThrow('API Error')
    })
  })

  describe('getCorporateNewsListByCategory', () => {
    it('カテゴリ別にお知らせ一覧を取得できる（仮実装）', async () => {
      const mockResponse = {
        contents: [createMockNews()],
        totalCount: 1,
        offset: 0,
        limit: 10,
      }
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getCorporateNewsListByCategory('some-category')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        queries: undefined,
      })
      expect(result).toEqual(mockResponse)
    })

    it('APIエラー時にエラーをスローする', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error('API Error'))
      await expect(
        getCorporateNewsListByCategory('some-category')
      ).rejects.toThrow('API Error')
    })
  })
}) 