import { client } from './client'
import { mediaArticleListSchema, type MediaArticle } from '@/lib/schema'
import type { MicroCMSQueries } from 'microcms-js-sdk'

/**
 * 記事を検索する
 *
 * @doc microCMSの全文検索APIを使用して記事を検索
 * @issue #29 - サイト内検索機能の実装
 * @param query - 検索キーワード
 * @param options - 検索オプション
 * @returns 検索結果
 */
export async function searchMediaArticles(
  query: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  const { limit = 20, offset = 0 } = options || {}

  try {
    const response = await client.getList<MediaArticle>({
      endpoint: 'media_articles',
      queries: {
        q: query, // 全文検索パラメータ
        limit,
        offset,
        orders: '-publishedAt',
      } as MicroCMSQueries,
    })

    // レスポンスをスキーマで検証
    const validatedResponse = mediaArticleListSchema.parse(response)
    return validatedResponse
  } catch (error) {
    console.error('Failed to search articles:', error)
    throw new Error('記事の検索に失敗しました')
  }
}

/**
 * 検索キーワードをハイライト用に処理する
 *
 * @param text - ハイライト対象のテキスト
 * @param query - 検索キーワード
 * @returns ハイライト用の配列
 */
export function highlightSearchQuery(text: string, query: string): Array<string | { type: 'mark'; key: number; text: string }> {
  if (!query) return [text]

  // 検索キーワードを正規表現エスケープ
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  
  const parts = text.split(regex)
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      // マッチした部分をハイライト
      return {
        type: 'mark' as const,
        key: index,
        text: part,
      }
    }
    return part
  })
}