import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// next/headers をモック
vi.mock('next/headers', () => ({
  draftMode: vi.fn(),
}))

describe('/api/exit-preview', () => {
  let mockDisable: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockDisable = vi.fn()
    const { draftMode } = await import('next/headers')
    vi.mocked(draftMode).mockResolvedValue({
      enable: vi.fn(),
      disable: mockDisable,
      isEnabled: false,
    })
  })

  describe('GET', () => {
    it('プレビューモードを無効化してホームへリダイレクトする', async () => {
      const request = new NextRequest('http://localhost:3000/api/exit-preview')

      const response = await GET(request)

      expect(mockDisable).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('redirectパラメータが指定された場合は指定先へリダイレクトする', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/exit-preview?redirect=/media/articles'
      )

      const response = await GET(request)

      expect(mockDisable).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/media/articles'
      )
    })

    it('draftMode().disableでエラーが発生してもホームへリダイレクトする', async () => {
      const { draftMode } = await import('next/headers')
      vi.mocked(draftMode).mockRejectedValueOnce(
        new Error('Draft mode error')
      )

      const request = new NextRequest('http://localhost:3000/api/exit-preview')

      const response = await GET(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('外部URLへのリダイレクトを防ぐ', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/exit-preview?redirect=https://evil.com'
      )

      const response = await GET(request)

      expect(mockDisable).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(307)
      // 外部URLの場合はホームへリダイレクト
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })
  })
})