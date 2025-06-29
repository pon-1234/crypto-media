/**
 * microCMS クライアント設定
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { createClient } from 'microcms-js-sdk'

if (!process.env.MICROCMS_SERVICE_DOMAIN) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is required')
}

if (!process.env.MICROCMS_API_KEY) {
  throw new Error('MICROCMS_API_KEY is required')
}

/**
 * microCMS クライアントインスタンス
 * @see https://github.com/microcmsio/microcms-js-sdk
 */
export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
})

/**
 * プレビューモードでの記事取得について
 * 
 * プレビューモードでは通常のクライアントを使用し、
 * APIメソッド呼び出し時にdraftKeyをクエリパラメータとして渡します。
 * 
 * 例:
 * ```typescript
 * const preview = await client.get({
 *   endpoint: 'media_articles',
 *   contentId: 'xxx',
 *   queries: { draftKey: 'yyy' }
 * })
 * ```
 */

/**
 * API呼び出しの共通オプション
 */
export const defaultQueries = {
  limit: 100,
  orders: '-publishedAt', // 最新順
} as const

/**
 * リスト取得時の最大件数
 */
export const MAX_LIMIT = 100

/**
 * 画像最適化用のパラメータを生成
 * @param url - microCMSの画像URL
 * @param options - 画像変換オプション
 */
export const getOptimizedImageUrl = (
  url: string,
  options: {
    width?: number
    height?: number
    format?: 'webp' | 'jpg' | 'png'
    quality?: number
  } = {}
): string => {
  const params = new URLSearchParams()
  
  if (options.width) params.append('w', options.width.toString())
  if (options.height) params.append('h', options.height.toString())
  if (options.format) params.append('fm', options.format)
  if (options.quality) params.append('q', options.quality.toString())
  
  return `${url}?${params.toString()}`
}