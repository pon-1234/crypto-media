import { Redis } from '@upstash/redis'

/**
 * Redis-based rate limiter for production environments
 * @doc Rate limiting implementation for Stripe webhooks
 * @related src/app/api/stripe/webhook/route.ts
 */

// Upstash Redisクライアント（環境変数から設定）
const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * Rate limiterインターフェース
 */
export interface RateLimiter {
  checkLimit(key: string): Promise<boolean>
}

/**
 * メモリベースのrate limiter（開発環境用）
 */
export class MemoryRateLimiter implements RateLimiter {
  private requestCounts = new Map<string, { count: number; resetTime: number }>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now()
    const limit = this.requestCounts.get(key)
    
    if (!limit || now > limit.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }
    
    if (limit.count >= this.maxRequests) {
      return false
    }
    
    limit.count++
    return true
  }
}

/**
 * Redisベースのrate limiter（本番環境用）
 */
export class RedisRateLimiter implements RateLimiter {
  private readonly maxRequests: number
  private readonly windowSeconds: number

  constructor(maxRequests: number = 10, windowSeconds: number = 60) {
    this.maxRequests = maxRequests
    this.windowSeconds = windowSeconds
  }

  async checkLimit(key: string): Promise<boolean> {
    if (!redis) {
      console.warn('Redis not configured, skipping rate limit')
      return true
    }

    try {
      const redisKey = `rate_limit:${key}`
      const current = await redis.incr(redisKey)
      
      if (current === 1) {
        // 初回リクエストの場合、TTLを設定
        await redis.expire(redisKey, this.windowSeconds)
      }
      
      return current <= this.maxRequests
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // エラーの場合はリクエストを許可（サービスを継続）
      return true
    }
  }
}

/**
 * 環境に応じたrate limiterを取得
 */
export function getRateLimiter(): RateLimiter {
  if (redis && process.env.NODE_ENV === 'production') {
    return new RedisRateLimiter()
  }
  return new MemoryRateLimiter()
}