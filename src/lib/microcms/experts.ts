/**
 * 執筆者・監修者 API クライアント
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type MicroCMSQueries } from 'microcms-js-sdk'
import { client } from './client'
import { type Expert, expertListSchema, expertSchema } from '@/lib/schema'
import { getAllContents } from './utils'

/**
 * 執筆者・監修者一覧を取得
 * @param queries クエリパラメータ
 * @returns 執筆者・監修者一覧
 */
export async function getExperts(queries?: MicroCMSQueries) {
  const data = await client.getList({
    endpoint: 'experts',
    queries,
  })
  return expertListSchema.parse(data)
}

/**
 * 執筆者・監修者の詳細をIDで取得
 * @param id 執筆者・監修者ID
 * @param queries クエリパラメータ
 * @returns 執筆者・監修者詳細
 */
export async function getExpertById(
  id: string,
  queries?: MicroCMSQueries
): Promise<Expert> {
  const data = await client.get({
    endpoint: 'experts',
    contentId: id,
    queries,
  })
  return expertSchema.parse(data)
}

/**
 * 執筆者・監修者の詳細をslugで取得
 * @param slug URLスラッグ
 * @returns 執筆者・監修者詳細
 */
export async function getExpertBySlug(slug: string): Promise<Expert> {
  const data = await client.getList({
    endpoint: 'experts',
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
    },
  })

  const parsed = expertListSchema.parse(data)
  if (parsed.contents.length === 0) {
    throw new Error(`Expert not found: ${slug}`)
  }

  return parsed.contents[0]
}

/**
 * すべての執筆者・監修者のIDを取得
 * @returns 執筆者・監修者IDの配列
 */
export async function getAllExpertIds(): Promise<string[]> {
  const allExperts = await getAllContents<{ id: string }>('experts', {
    fields: 'id',
  })

  return allExperts.map((item) => item.id)
}

/**
 * すべての執筆者・監修者のslugを取得
 * @returns 執筆者・監修者slugの配列
 */
export async function getAllExpertSlugs(): Promise<string[]> {
  const allExperts = await getAllContents<{ id: string; slug: string }>(
    'experts',
    {
      fields: 'id,slug',
    }
  )

  return allExperts.map((item) => item.slug)
}
