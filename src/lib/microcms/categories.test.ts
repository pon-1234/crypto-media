import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCategories, getCategoryBySlug, getCategoryById } from './categories'
import { client } from './client'
import type { Category } from '@/lib/schema/category.schema'

// Mock the client
vi.mock('./client', () => ({
  client: {
    getList: vi.fn(),
    get: vi.fn(),
  },
}))

describe('categories API', () => {
  const mockCategory: Category = {
    id: 'cat1',
    name: 'テクノロジー',
    slug: 'technology',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('fetches all categories successfully', async () => {
      const mockResponse = {
        contents: [mockCategory],
        totalCount: 1,
        offset: 0,
        limit: 10,
      }

      vi.mocked(client.getList).mockResolvedValue(mockResponse)

      const result = await getCategories()

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'categories',
        queries: undefined,
      })
      expect(result).toEqual(mockResponse)
    })

    it('passes queries to client', async () => {
      const queries = { limit: 5, offset: 10 }

      await getCategories(queries)

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'categories',
        queries,
      })
    })
  })

  describe('getCategoryBySlug', () => {
    it('fetches category by slug successfully', async () => {
      const mockResponse = {
        contents: [mockCategory],
        totalCount: 1,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.getList).mockResolvedValue(mockResponse)

      const result = await getCategoryBySlug('technology')

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'categories',
        queries: {
          filters: 'slug[equals]technology',
          limit: 1,
        },
      })
      expect(result).toEqual(mockCategory)
    })

    it('returns null when category not found', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.getList).mockResolvedValue(mockResponse)

      const result = await getCategoryBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('returns null on error', async () => {
      vi.mocked(client.getList).mockRejectedValue(new Error('API error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await getCategoryBySlug('technology')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching category by slug:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getCategoryById', () => {
    it('fetches category by ID successfully', async () => {
      vi.mocked(client.get).mockResolvedValue(mockCategory)

      const result = await getCategoryById('cat1')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'categories',
        contentId: 'cat1',
        queries: undefined,
      })
      expect(result).toEqual(mockCategory)
    })

    it('passes queries to client', async () => {
      const queries = { fields: 'id,name' }

      await getCategoryById('cat1', queries)

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'categories',
        contentId: 'cat1',
        queries,
      })
    })
  })
})
