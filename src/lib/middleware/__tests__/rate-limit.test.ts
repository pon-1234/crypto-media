import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// 環境変数を設定
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

// モック設定を先に行う
const mockRedisInstance = {
  zrange: vi.fn(),
  zadd: vi.fn(),
  zremrangebyscore: vi.fn(),
  expire: vi.fn(),
}

// Redisのモック
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => mockRedisInstance),
}))

// モック設定後にインポート
import { rateLimit, rateLimitMiddleware } from '../rate-limit'

describe('rate-limit', () => {
  beforeEach(() => {
    // モックをリセット
    mockRedisInstance.zrange.mockReset()
    mockRedisInstance.zadd.mockReset()
    mockRedisInstance.zremrangebyscore.mockReset()
    mockRedisInstance.expire.mockReset()
  })

  describe('rateLimit', () => {
    it('リクエストが制限内の場合はsuccessを返す', async () => {
      mockRedisInstance.zrange.mockResolvedValueOnce([])

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      const result = await rateLimit(request)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(9) // デフォルトは10リクエスト、1つ使用
      expect(mockRedisInstance.zadd).toHaveBeenCalled()
    })

    it('リクエストが制限を超えた場合はfalseを返す', async () => {
      // 10個のリクエストを返す（制限に達している）
      mockRedisInstance.zrange.mockResolvedValueOnce(Array(10).fill({}))
      mockRedisInstance.zrange.mockResolvedValueOnce([
        { score: Date.now() - 30000 },
      ])

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      const result = await rateLimit(request, { max: 10 })

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('カスタム設定を適用できる', async () => {
      mockRedisInstance.zrange.mockResolvedValueOnce([])

      const request = new NextRequest('http://localhost:3000/api/test')
      const config = {
        windowMs: 30 * 1000, // 30秒
        max: 5,
        keyPrefix: 'custom',
      }

      await rateLimit(request, config)

      expect(mockRedisInstance.expire).toHaveBeenCalledWith(
        expect.stringContaining('custom:'),
        30
      )
    })

    it('Redisエラー時はfail openで通過させる', async () => {
      mockRedisInstance.zrange.mockRejectedValueOnce(new Error('Redis error'))

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await rateLimit(request)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(10)
    })
  })

  describe('rateLimitMiddleware', () => {
    it('レート制限に達した場合は429を返す', async () => {
      mockRedisInstance.zrange.mockResolvedValueOnce(Array(10).fill({}))
      mockRedisInstance.zrange.mockResolvedValueOnce([
        { score: Date.now() - 30000 },
      ])

      const middleware = rateLimitMiddleware({ max: 10 })
      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await middleware(request)

      expect(response?.status).toBe(429)
      const data = await response?.json()
      expect(data.error).toBe('Too many requests')
      expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('レート制限内の場合はヘッダーを追加してnextを返す', async () => {
      mockRedisInstance.zrange.mockResolvedValueOnce([])

      const middleware = rateLimitMiddleware()
      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await middleware(request)

      expect(response?.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response?.headers.get('X-RateLimit-Remaining')).toBe('9')
    })
  })
})
