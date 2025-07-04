/**
 * 特集記事 API クライアント
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type MicroCMSQueries } from 'microcms-js-sdk'
import { client } from './client'
import { type Feature, featureListSchema, featureSchema } from '@/lib/schema'
import { getAllContents } from './utils'

/**
 * 特集一覧を取得
 * @param queries クエリパラメータ
 * @returns 特集一覧
 */
export async function getFeatures(queries?: MicroCMSQueries) {
  const data = await client.getList({
    endpoint: 'features',
    queries,
  })
  return featureListSchema.parse(data)
}

/**
 * 特集の詳細をIDで取得
 * @param id 特集ID
 * @param queries クエリパラメータ
 * @returns 特集詳細
 */
export async function getFeatureById(
  id: string,
  queries?: MicroCMSQueries
): Promise<Feature> {
  const data = await client.get({
    endpoint: 'features',
    contentId: id,
    queries,
  })
  return featureSchema.parse(data)
}

/**
 * 特集の詳細をslugで取得
 * @param slug URLスラッグ
 * @returns 特集詳細
 */
export async function getFeatureBySlug(slug: string): Promise<Feature> {
  const data = await client.getList({
    endpoint: 'features',
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
    },
  })

  const parsed = featureListSchema.parse(data)
  if (parsed.contents.length === 0) {
    throw new Error(`Feature not found: ${slug}`)
  }

  return parsed.contents[0]
}

/**
 * すべての特集のIDを取得
 * @returns 特集IDの配列
 */
export async function getAllFeatureIds(): Promise<string[]> {
  const allFeatures = await getAllContents<{ id: string }>('features', {
    fields: 'id',
  })

  return allFeatures.map((item) => item.id)
}

/**
 * すべての特集のslugを取得
 * @returns 特集slugの配列
 */
export async function getAllFeatureSlugs(): Promise<string[]> {
  const allFeatures = await getAllContents<{ id: string; slug: string }>(
    'features',
    {
      fields: 'id,slug',
    }
  )

  return allFeatures.map((item) => item.slug)
}
