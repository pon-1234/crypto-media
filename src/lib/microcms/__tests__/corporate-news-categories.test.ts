/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCorporateNewsCategoryBySlug,
  getAllCorporateNewsCategorySlugs,
} from '../corporate-news-categories'
import { client } from '../client'

vi.mock('../client', () => ({
  client: {
    getList: vi.fn(),
  },
}))

vi.mock('../utils', () => ({
  getAllContents: vi.fn(),
}))

import { getAllContents } from '../utils'

describe('corporate-news-categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCorporateNewsCategoryBySlug', () => {
    it('スラッグでカテゴリを取得できる', async () => {
      const mockCategory = {
        id: 'cat1',
        name: 'プレスリリース',
        slug: 'press-release',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
        revisedAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(client.getList).mockResolvedValueOnce({
        contents: [mockCategory],
        totalCount: 1,
        offset: 0,
        limit: 1,
      })

      const result = await getCorporateNewsCategoryBySlug('press-release')

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'corporate_news_categories',
        queries: { filters: 'slug[equals]press-release', limit: 1 },
      })
      expect(result).toEqual(mockCategory)
    })

    it('カテゴリが見つからない場合はnullを返す', async () => {
      vi.mocked(client.getList).mockResolvedValueOnce({
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1,
      })

      const result = await getCorporateNewsCategoryBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('APIエラー時はnullを返す', async () => {
      vi.mocked(client.getList).mockRejectedValueOnce(new Error('API Error'))

      const result = await getCorporateNewsCategoryBySlug('press-release')

      expect(result).toBeNull()
    })
  })

  describe('getAllCorporateNewsCategorySlugs', () => {
    it('全カテゴリのスラッグを取得できる', async () => {
      const mockCategories = [
        { id: 'cat1', slug: 'press-release' },
        { id: 'cat2', slug: 'media-coverage' },
        { id: 'cat3', slug: 'events' },
      ]

      vi.mocked(getAllContents).mockResolvedValueOnce(mockCategories)

      const result = await getAllCorporateNewsCategorySlugs()

      expect(getAllContents).toHaveBeenCalledWith('corporate_news_categories', {
        fields: 'id,slug',
      })
      expect(result).toEqual(['press-release', 'media-coverage', 'events'])
    })

    it('APIエラー時は空配列を返す', async () => {
      vi.mocked(getAllContents).mockRejectedValueOnce(new Error('API Error'))

      const result = await getAllCorporateNewsCategorySlugs()

      expect(result).toEqual([])
    })
  })
})