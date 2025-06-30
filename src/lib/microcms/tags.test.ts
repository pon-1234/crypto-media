import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTags, getTagBySlug, getTagById } from './tags'
import { client } from './client'
import type { Tag } from '@/lib/schema/tag.schema'

// Mock the client
vi.mock('./client', () => ({
  client: {
    getList: vi.fn(),
    get: vi.fn(),
  },
}))

describe('tags API', () => {
  const mockTag: Tag = {
    id: 'tag1',
    name: 'ビットコイン',
    slug: 'bitcoin',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTags', () => {
    it('fetches all tags successfully', async () => {
      const mockResponse = {
        contents: [mockTag],
        totalCount: 1,
        offset: 0,
        limit: 10,
      }

      vi.mocked(client.getList).mockResolvedValue(mockResponse)

      const result = await getTags()

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'tags',
        queries: undefined,
      })
      expect(result).toEqual(mockResponse)
    })

    it('passes queries to client', async () => {
      const queries = { limit: 5, offset: 10 }

      await getTags(queries)

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'tags',
        queries,
      })
    })
  })

  describe('getTagBySlug', () => {
    it('fetches tag by slug successfully', async () => {
      const mockResponse = {
        contents: [mockTag],
        totalCount: 1,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.getList).mockResolvedValue(mockResponse)

      const result = await getTagBySlug('bitcoin')

      expect(client.getList).toHaveBeenCalledWith({
        endpoint: 'tags',
        queries: {
          filters: 'slug[equals]bitcoin',
          limit: 1,
        },
      })
      expect(result).toEqual(mockTag)
    })

    it('returns null when tag not found', async () => {
      const mockResponse = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1,
      }

      vi.mocked(client.getList).mockResolvedValue(mockResponse)

      const result = await getTagBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('returns null on error', async () => {
      vi.mocked(client.getList).mockRejectedValue(new Error('API error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await getTagBySlug('bitcoin')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching tag by slug:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getTagById', () => {
    it('fetches tag by ID successfully', async () => {
      vi.mocked(client.get).mockResolvedValue(mockTag)

      const result = await getTagById('tag1')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'tags',
        contentId: 'tag1',
        queries: undefined,
      })
      expect(result).toEqual(mockTag)
    })

    it('passes queries to client', async () => {
      const queries = { fields: 'id,name' }

      await getTagById('tag1', queries)

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'tags',
        contentId: 'tag1',
        queries,
      })
    })
  })
})