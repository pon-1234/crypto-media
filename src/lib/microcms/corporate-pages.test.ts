import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getCorporatePages, 
  getCorporatePageBySlug, 
  getCorporatePageById,
  corporatePageExists 
} from './corporate-pages'
import { client } from './client'
import { MicroCMSApiError } from './errors'

vi.mock('./client', () => ({
  client: {
    get: vi.fn()
  },
  defaultQueries: {
    limit: 100,
    orders: '-publishedAt'
  }
}))

describe('corporate-pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockCorporatePage = {
    id: 'test-id',
    slug: 'about',
    title: '会社概要',
    description: '当社について',
    content: '<p>会社概要の内容</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    publishedAt: '2025-01-01T00:00:00.000Z'
  }

  const mockListResponse = {
    contents: [mockCorporatePage],
    totalCount: 1,
    offset: 0,
    limit: 100
  }

  describe('getCorporatePages', () => {
    it('should fetch all corporate pages', async () => {
      vi.mocked(client.get).mockResolvedValueOnce(mockListResponse)

      const result = await getCorporatePages()

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'pages_corporate',
        queries: {
          limit: 100,
          orders: '-publishedAt'
        }
      })
      expect(result).toEqual(mockListResponse)
    })

    it('should pass custom queries', async () => {
      vi.mocked(client.get).mockResolvedValueOnce(mockListResponse)

      await getCorporatePages({ limit: 10, offset: 20, draftKey: 'test-key' })

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'pages_corporate',
        queries: {
          limit: 10,
          orders: '-publishedAt',
          offset: 20,
          draftKey: 'test-key'
        }
      })
    })
  })

  describe('getCorporatePageBySlug', () => {
    it('should fetch a corporate page by slug', async () => {
      vi.mocked(client.get).mockResolvedValueOnce(mockListResponse)

      const result = await getCorporatePageBySlug('about')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'pages_corporate',
        queries: {
          filters: 'slug[equals]about',
          limit: 1
        }
      })
      expect(result).toEqual(mockCorporatePage)
    })

    it('should return null when page not found', async () => {
      vi.mocked(client.get).mockResolvedValueOnce({
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1
      })

      const result = await getCorporatePageBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('should pass draftKey for preview mode', async () => {
      vi.mocked(client.get).mockResolvedValueOnce(mockListResponse)

      await getCorporatePageBySlug('about', { draftKey: 'preview-key' })

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'pages_corporate',
        queries: {
          filters: 'slug[equals]about',
          limit: 1,
          draftKey: 'preview-key'
        }
      })
    })

    it('should handle 404 errors gracefully', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new MicroCMSApiError('Not Found', 404))

      const result = await getCorporatePageBySlug('not-found')

      expect(result).toBeNull()
    })

    it('should throw non-404 errors', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error('Network error'))

      await expect(getCorporatePageBySlug('about')).rejects.toThrow(MicroCMSApiError)
    })
  })

  describe('getCorporatePageById', () => {
    it('should fetch a corporate page by ID', async () => {
      vi.mocked(client.get).mockResolvedValueOnce(mockCorporatePage)

      const result = await getCorporatePageById('test-id')

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'pages_corporate',
        contentId: 'test-id',
        queries: undefined
      })
      expect(result).toEqual(mockCorporatePage)
    })

    it('should pass draftKey for preview mode', async () => {
      vi.mocked(client.get).mockResolvedValueOnce(mockCorporatePage)

      await getCorporatePageById('test-id', { draftKey: 'preview-key' })

      expect(client.get).toHaveBeenCalledWith({
        endpoint: 'pages_corporate',
        contentId: 'test-id',
        queries: { draftKey: 'preview-key' }
      })
    })

    it('should return null for 404 errors', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new MicroCMSApiError('Not Found', 404))

      const result = await getCorporatePageById('not-found')

      expect(result).toBeNull()
    })

    it('should throw non-404 errors', async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error('Server error'))

      await expect(getCorporatePageById('test-id')).rejects.toThrow(MicroCMSApiError)
    })
  })

  describe('corporatePageExists', () => {
    it('should return true when page exists', async () => {
      vi.mocked(client.get).mockResolvedValueOnce(mockListResponse)

      const result = await corporatePageExists('about')

      expect(result).toBe(true)
    })

    it('should return false when page does not exist', async () => {
      vi.mocked(client.get).mockResolvedValueOnce({
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 1
      })

      const result = await corporatePageExists('non-existent')

      expect(result).toBe(false)
    })
  })
})