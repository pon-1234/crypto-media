import {
  corporateNewsListSchema,
  corporateNewsSchema,
  type CorporateNews,
} from '@/lib/schema'
import type { MicroCMSQueries } from 'microcms-js-sdk'
import { client } from './client'
import { handleError } from '@/lib/utils/handleError'

/**
 * コーポレートお知らせ一覧を取得する
 *
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */
export async function getCorporateNewsList(queries?: MicroCMSQueries): Promise<{
  contents: CorporateNews[]
  totalCount: number
  offset: number
  limit: number
}> {
  try {
    const response = await client.get({
      endpoint: 'corporate_news',
      queries,
    })

    return corporateNewsListSchema.parse(response)
  } catch (error) {
    handleError(error, 'Failed to fetch corporate news list')
    throw error
  }
}

/**
 * コーポレートお知らせの詳細を取得する
 *
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */
export async function getCorporateNewsDetail(
  contentId: string,
  queries?: MicroCMSQueries
): Promise<CorporateNews> {
  try {
    const response = await client.get({
      endpoint: 'corporate_news',
      contentId,
      queries,
    })

    return corporateNewsSchema.parse(response)
  } catch (error) {
    handleError(
      error,
      `Failed to fetch corporate news detail for id: ${contentId}`
    )
    throw error
  }
}

/**
 * すべてのコーポレートお知らせのIDを取得する
 * generateStaticParams用
 *
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */
export async function getAllCorporateNewsIds(): Promise<string[]> {
  try {
    const response = await client.get({
      endpoint: 'corporate_news',
      queries: {
        fields: 'id',
        limit: 100, // 必要に応じて調整
      },
    })

    // fields: 'id'を指定した場合は、idのみが返るためスキーマ検証をスキップ
    return response.contents.map((item: { id: string }) => item.id)
  } catch (error) {
    handleError(error, 'Failed to fetch corporate news IDs')
    throw error
  }
}

/**
 * カテゴリ別にコーポレートお知らせ一覧を取得する
 * TODO: microCMSにcategoryフィールドを追加後に実装を有効化
 *
 * @issue #35 - コーポレートサイトの未実装ページ作成
 */
export async function getCorporateNewsListByCategory(
  category: string,
  queries?: MicroCMSQueries
): Promise<{
  contents: CorporateNews[]
  totalCount: number
  offset: number
  limit: number
}> {
  try {
    // TODO: categoryフィールド追加後に以下のコメントを解除
    // const response = await client.get({
    //   endpoint: 'corporate_news',
    //   queries: {
    //     ...queries,
    //     filters: `category[equals]${category}`,
    //   },
    // })

    // 仮実装: 通常の一覧を返す
    const response = await client.get({
      endpoint: 'corporate_news',
      queries,
    })

    return corporateNewsListSchema.parse(response)
  } catch (error) {
    handleError(
      error,
      `Failed to fetch corporate news list for category: ${category}`
    )
    throw error
  }
}
