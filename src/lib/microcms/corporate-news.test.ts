import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCorporateNewsList, getCorporateNewsDetail, getAllCorporateNewsIds } from './corporate-news'
import { client } from './client'

/**
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

// clientをモック
vi.mock('./client', () => ({
  client: {
    get: vi.fn()
  }
}))

describe('corporate-news', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCorporateNewsList', () => {
    it('コーポレートお知らせ一覧を取得できる', async () => {
      const mockResponse = {
        contents: [
          {
            id: 'news-1',
            title: 'お知らせ1',
            content: '<p>内容1</p>',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            publishedAt: '2025-01-01T00:00:00.000Z',
            revisedAt: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 'news-2',
            title: 'お知らせ2',
            content: '<p>内容2</p>',
            createdAt: '2025-01-02T00:00:00.000Z',
            updatedAt: '2025-01-02T00:00:00.000Z',
            publishedAt: '2025-01-02T00:00:00.000Z',
            revisedAt: '2025-01-02T00:00:00.000Z'
          }
        ],
        totalCount: 2,
        offset: 0,
        limit: 10
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getCorporateNewsList()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        queries: undefined
      })
      expect(result).toEqual(mockResponse)
    })

    it('クエリパラメータを渡せる', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 5
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const queries = { limit: 5, offset: 10 }
      await getCorporateNewsList(queries)

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        queries
      })
    })

    it('エラーハンドリングが正しく動作する', async () => {
      const mockError = new Error('API Error')
      vi.mocked(client.get).mockRejectedValueOnce(mockError)

      await expect(getCorporateNewsList()).rejects.toThrow('API Error')
    })
  })

  describe('getCorporateNewsDetail', () => {
    it('コーポレートお知らせの詳細を取得できる', async () => {
      const mockResponse = {
        id: 'news-1',
        title: 'お知らせ1',
        content: '<p>内容1</p>',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        publishedAt: '2025-01-01T00:00:00.000Z',
        revisedAt: '2025-01-01T00:00:00.000Z'
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getCorporateNewsDetail('news-1')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        contentId: 'news-1',
        queries: undefined
      })
      expect(result).toEqual(mockResponse)
    })

    it('クエリパラメータを渡せる', async () => {
      const mockResponse = {
        id: 'news-1',
        title: 'お知らせ1',
        content: '<p>内容1</p>',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        publishedAt: '2025-01-01T00:00:00.000Z',
        revisedAt: '2025-01-01T00:00:00.000Z'
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const queries = { fields: 'id,title' }
      await getCorporateNewsDetail('news-1', queries)

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        contentId: 'news-1',
        queries
      })
    })

    it('エラーハンドリングが正しく動作する', async () => {
      const mockError = new Error('API Error')
      vi.mocked(client.get).mockRejectedValueOnce(mockError)

      await expect(getCorporateNewsDetail('news-1')).rejects.toThrow('API Error')
    })
  })

  describe('getAllCorporateNewsIds', () => {
    it('すべてのコーポレートお知らせのIDを取得できる', async () => {
      const mockResponse = {
        contents: [
          { 
            id: 'news-1',
            title: 'お知らせ1',
            content: '<p>内容1</p>',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            publishedAt: '2025-01-01T00:00:00.000Z',
            revisedAt: '2025-01-01T00:00:00.000Z'
          },
          { 
            id: 'news-2',
            title: 'お知らせ2',
            content: '<p>内容2</p>',
            createdAt: '2025-01-02T00:00:00.000Z',
            updatedAt: '2025-01-02T00:00:00.000Z',
            publishedAt: '2025-01-02T00:00:00.000Z',
            revisedAt: '2025-01-02T00:00:00.000Z'
          },
          { 
            id: 'news-3',
            title: 'お知らせ3',
            content: '<p>内容3</p>',
            createdAt: '2025-01-03T00:00:00.000Z',
            updatedAt: '2025-01-03T00:00:00.000Z',
            publishedAt: '2025-01-03T00:00:00.000Z',
            revisedAt: '2025-01-03T00:00:00.000Z'
          }
        ],
        totalCount: 3,
        offset: 0,
        limit: 100
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getAllCorporateNewsIds()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'corporate_news',
        queries: {
          fields: 'id',
          limit: 100
        }
      })
      expect(result).toEqual(['news-1', 'news-2', 'news-3'])
    })

    it('空の配列を返す場合も正しく動作する', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 100
      }

      vi.mocked(client.get).mockResolvedValueOnce(mockResponse)

      const result = await getAllCorporateNewsIds()

      expect(result).toEqual([])
    })

    it('エラーハンドリングが正しく動作する', async () => {
      const mockError = new Error('API Error')
      vi.mocked(client.get).mockRejectedValueOnce(mockError)

      await expect(getAllCorporateNewsIds()).rejects.toThrow('API Error')
    })
  })
})