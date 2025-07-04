/**
 * microCMS ユーティリティ関数
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type MicroCMSQueries } from 'microcms-js-sdk'
import { client } from './client'

/**
 * ページネーションを使用して全件取得する
 * @param endpoint エンドポイント名
 * @param queries 追加のクエリパラメータ
 * @returns 全件のコンテンツ配列
 */
export async function getAllContents<T extends { id: string }>(
  endpoint: string,
  queries?: Omit<MicroCMSQueries, 'limit' | 'offset'>
): Promise<T[]> {
  const allContents: T[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const response = await client.getList<T>({
      endpoint,
      queries: {
        ...queries,
        limit,
        offset,
      },
    })

    allContents.push(...response.contents)

    // 全件取得完了したら終了
    if (response.offset + response.limit >= response.totalCount) {
      break
    }

    offset += limit
  }

  return allContents
}

/**
 * プレーンテキストに変換（HTMLタグを除去）
 * @param html HTML文字列
 * @returns プレーンテキスト
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // HTMLタグを除去
    .replace(/&nbsp;/g, ' ') // &nbsp;をスペースに変換
    .replace(/&amp;/g, '&') // &amp;を&に変換
    .replace(/&lt;/g, '<') // &lt;を<に変換
    .replace(/&gt;/g, '>') // &gt;を>に変換
    .replace(/&quot;/g, '"') // &quot;を"に変換
    .replace(/&#039;/g, "'") // &#039;を'に変換
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .trim()
}
