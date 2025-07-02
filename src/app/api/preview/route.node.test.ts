import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// next/headers をモック
vi.mock('next/headers', () => ({
  draftMode: vi.fn(),
}))

describe('/api/preview', () => {
  let mockEnable: ReturnType<typeof vi.fn>
  const originalEnv = process.env

  beforeEach(async () => {
    vi.clearAllMocks()
    // 環境変数をリセット
    process.env = { ...originalEnv }
    delete process.env.MICROCMS_PREVIEW_SECRET
    
    mockEnable = vi.fn()
    const { draftMode } = await import('next/headers')
    vi.mocked(draftMode).mockResolvedValue({
      enable: mockEnable,
      disable: vi.fn(),
      isEnabled: false,
    })
  })
  
  afterEach(() => {
    process.env = originalEnv
  })

  describe('GET', () => {
    it('開発環境ではdraftKey検証なしでプレビューモードを有効化できる', async () => {
      process.env.NODE_ENV = 'development'
      
      const request = new NextRequest(
        'http://localhost:3000/api/preview?contentId=test-id&draftKey=test-key&endpoint=media_articles'
      )

      const response = await GET(request)

      expect(mockEnable).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain(
        '/media/articles/test-id?draftKey=test-key'
      )
    })

    it('corporate_newsエンドポイントで正常にプレビューモードを有効化できる', async () => {
      process.env.NODE_ENV = 'development'
      
      const request = new NextRequest(
        'http://localhost:3000/api/preview?contentId=news-id&draftKey=news-key&endpoint=corporate_news'
      )

      const response = await GET(request)

      expect(mockEnable).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain(
        '/news/news-id?draftKey=news-key'
      )
    })
    
    it('本番環境で無効なdraftKeyの場合は403エラーを返す', async () => {
      process.env.NODE_ENV = 'production'
      process.env.MICROCMS_PREVIEW_SECRET = 'test-secret'
      
      const request = new NextRequest(
        'http://localhost:3000/api/preview?contentId=test-id&draftKey=invalid-key&endpoint=media_articles'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid draft key')
      expect(mockEnable).not.toHaveBeenCalled()
    })

    it('必須パラメータが不足している場合は400エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/preview?contentId=test-id'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid parameters')
      expect(data.details).toBeDefined()
      expect(mockEnable).not.toHaveBeenCalled()
    })

    it('無効なエンドポイントの場合は400エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/preview?contentId=test-id&draftKey=test-key&endpoint=invalid'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid parameters')
      expect(mockEnable).not.toHaveBeenCalled()
    })

    it('空のcontentIdの場合は400エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/preview?contentId=&draftKey=test-key&endpoint=media_articles'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid parameters')
      expect(mockEnable).not.toHaveBeenCalled()
    })

    it('draftMode().enableでエラーが発生した場合は500エラーを返す', async () => {
      process.env.NODE_ENV = 'development'
      
      const { draftMode } = await import('next/headers')
      vi.mocked(draftMode).mockRejectedValueOnce(
        new Error('Draft mode error')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/preview?contentId=test-id&draftKey=test-key&endpoint=media_articles'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to enable preview mode')
    })
  })
})