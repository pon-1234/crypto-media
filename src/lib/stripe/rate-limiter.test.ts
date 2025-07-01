import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRateLimiter, RedisRateLimiter, getRateLimiter } from './rate-limiter'

// Mock Redis instance
const mockRedisInstance = {
  incr: vi.fn(),
  expire: vi.fn(),
}

// Mock Upstash Redis
vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => mockRedisInstance)
  }
})

describe('MemoryRateLimiter', () => {
  let limiter: MemoryRateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    limiter = new MemoryRateLimiter(3, 60000) // 3 requests per minute
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('最初のリクエストを許可する', async () => {
    const result = await limiter.checkLimit('test-key')
    expect(result).toBe(true)
  })

  it('制限内の複数のリクエストを許可する', async () => {
    expect(await limiter.checkLimit('test-key')).toBe(true)
    expect(await limiter.checkLimit('test-key')).toBe(true)
    expect(await limiter.checkLimit('test-key')).toBe(true)
  })

  it('制限を超えたリクエストを拒否する', async () => {
    // 制限まで使用
    await limiter.checkLimit('test-key')
    await limiter.checkLimit('test-key')
    await limiter.checkLimit('test-key')
    
    // 4回目は拒否される
    expect(await limiter.checkLimit('test-key')).toBe(false)
  })

  it('時間窓が過ぎたらカウントをリセットする', async () => {
    // 制限まで使用
    await limiter.checkLimit('test-key')
    await limiter.checkLimit('test-key')
    await limiter.checkLimit('test-key')
    
    // 制限を超えているので拒否
    expect(await limiter.checkLimit('test-key')).toBe(false)
    
    // 時間を進める
    vi.advanceTimersByTime(60001)
    
    // リセットされているので許可
    expect(await limiter.checkLimit('test-key')).toBe(true)
  })

  it('異なるキーは独立してカウントする', async () => {
    // key1で制限まで使用
    await limiter.checkLimit('key1')
    await limiter.checkLimit('key1')
    await limiter.checkLimit('key1')
    expect(await limiter.checkLimit('key1')).toBe(false)
    
    // key2は別カウントなので許可
    expect(await limiter.checkLimit('key2')).toBe(true)
  })

  it('カスタムパラメータで初期化できる', async () => {
    const customLimiter = new MemoryRateLimiter(1, 1000) // 1 request per second
    
    expect(await customLimiter.checkLimit('test')).toBe(true)
    expect(await customLimiter.checkLimit('test')).toBe(false)
    
    vi.advanceTimersByTime(1001)
    expect(await customLimiter.checkLimit('test')).toBe(true)
  })
})

describe('RedisRateLimiter', () => {
  const originalEnv = process.env
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    console.warn = vi.fn()
    console.error = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
    vi.resetAllMocks()
  })

  it('Redisが設定されていない場合は警告を出して許可する', async () => {
    // Redis環境変数を削除
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    
    const limiter = new RedisRateLimiter(3, 60)
    const result = await limiter.checkLimit('test-key')
    
    expect(result).toBe(true)
    expect(console.warn).toHaveBeenCalledWith('Redis not configured, skipping rate limit')
  })


  it('カスタムパラメータで初期化できる', async () => {
    const limiter = new RedisRateLimiter(5, 120)
    
    // カスタムパラメータが正しく設定されていることを確認
    // Redisが設定されていないので、警告を出してtrueを返す
    const result = await limiter.checkLimit('test-key')
    
    expect(result).toBe(true)
    expect(console.warn).toHaveBeenCalledWith('Redis not configured, skipping rate limit')
  })
})

describe('getRateLimiter', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('本番環境でRedisが設定されている場合はRedisRateLimiterを返す', async () => {
    process.env.NODE_ENV = 'production'
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    
    const { getRateLimiter: reloadedGetRateLimiter, RedisRateLimiter: ReloadedRedisRateLimiter } = await import('./rate-limiter')
    const limiter = reloadedGetRateLimiter()
    
    expect(limiter).toBeInstanceOf(ReloadedRedisRateLimiter)
  })

  it('本番環境でもRedisが設定されていない場合はMemoryRateLimiterを返す', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    
    const { getRateLimiter: reloadedGetRateLimiter, MemoryRateLimiter: ReloadedMemoryRateLimiter } = await import('./rate-limiter')
    const limiter = reloadedGetRateLimiter()
    
    expect(limiter).toBeInstanceOf(ReloadedMemoryRateLimiter)
  })

  it('開発環境ではMemoryRateLimiterを返す', async () => {
    process.env.NODE_ENV = 'development'
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    
    const { getRateLimiter: reloadedGetRateLimiter, MemoryRateLimiter: ReloadedMemoryRateLimiter } = await import('./rate-limiter')
    const limiter = reloadedGetRateLimiter()
    
    expect(limiter).toBeInstanceOf(ReloadedMemoryRateLimiter)
  })

  it('テスト環境ではMemoryRateLimiterを返す', async () => {
    process.env.NODE_ENV = 'test'
    
    const { getRateLimiter: reloadedGetRateLimiter, MemoryRateLimiter: ReloadedMemoryRateLimiter } = await import('./rate-limiter')
    const limiter = reloadedGetRateLimiter()
    
    expect(limiter).toBeInstanceOf(ReloadedMemoryRateLimiter)
  })
})