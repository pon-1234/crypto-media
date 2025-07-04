import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// レート制限の設定
interface RateLimitConfig {
  windowMs: number // 時間窓（ミリ秒）
  max: number // 最大リクエスト数
  keyPrefix: string // Redisキーのプレフィックス
}

// デフォルト設定
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1分
  max: 10, // 1分間に10リクエストまで
  keyPrefix: 'rate-limit',
}

// Redis クライアントの初期化
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * IPアドレスまたはユーザーIDベースのレート制限
 * @doc アカウント関連APIのレート制限実装
 * @related src/app/api/account/* - アカウント関連API
 */
export async function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // クライアントIPアドレスを取得
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // レート制限のキー
  const key = `${finalConfig.keyPrefix}:${ip}`

  try {
    // 現在の時刻
    const now = Date.now()
    const windowStart = now - finalConfig.windowMs

    // 時間窓内のリクエスト数を取得
    const requests = await redis.zrange(key, windowStart, now)
    const requestCount = requests.length

    // レート制限チェック
    if (requestCount >= finalConfig.max) {
      // 最も古いリクエストの時刻を取得
      const oldestRequest = (await redis.zrange(key, 0, 0, {
        withScores: true,
      })) as Array<{ member: string; score: number }>
      const reset = oldestRequest[0]
        ? Math.ceil((oldestRequest[0].score + finalConfig.windowMs) / 1000)
        : Math.ceil((now + finalConfig.windowMs) / 1000)

      return {
        success: false,
        remaining: 0,
        reset,
      }
    }

    // 新しいリクエストを記録
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })

    // 古いエントリを削除
    await redis.zremrangebyscore(key, 0, windowStart)

    // TTLを設定
    await redis.expire(key, Math.ceil(finalConfig.windowMs / 1000))

    return {
      success: true,
      remaining: finalConfig.max - requestCount - 1,
      reset: Math.ceil((now + finalConfig.windowMs) / 1000),
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // エラー時は通過させる（fail open）
    return {
      success: true,
      remaining: finalConfig.max,
      reset: 0,
    }
  }
}

/**
 * レート制限ミドルウェア
 */
export function rateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  return async (request: NextRequest) => {
    const result = await rateLimit(request, config)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message:
            'リクエスト数が制限を超えました。しばらく待ってから再試行してください。',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(config?.max || DEFAULT_CONFIG.max),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
            'Retry-After': String(result.reset - Math.floor(Date.now() / 1000)),
          },
        }
      )
    }

    // レート制限情報をヘッダーに追加
    const response = NextResponse.next()
    response.headers.set(
      'X-RateLimit-Limit',
      String(config?.max || DEFAULT_CONFIG.max)
    )
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset', String(result.reset))

    return response
  }
}
