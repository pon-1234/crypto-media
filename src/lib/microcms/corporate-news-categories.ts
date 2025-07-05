/**
 * コーポレートニュースカテゴリ用のAPIクライアント
 * @doc コーポレートニュースのカテゴリ管理機能
 * @related corporate-news.ts
 * @issue #41 - コーポレートニュースのカテゴリ機能
 */
import { client } from './client'
import { corporateNewsCategoryListSchema } from '@/lib/schema'
import { getAllContents } from './utils'
import type { CorporateNewsCategory } from '@/lib/schema'

/**
 * コーポレートニュースカテゴリをスラッグで取得
 * @doc 指定されたスラッグに一致するカテゴリを取得
 * @param slug カテゴリのスラッグ
 * @returns カテゴリオブジェクト、存在しない場合はnull
 */
export async function getCorporateNewsCategoryBySlug(
  slug: string
): Promise<CorporateNewsCategory | null> {
  const response = await client.getList({
    endpoint: 'corporate_news_categories',
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  })
  const validated = corporateNewsCategoryListSchema.parse(response)
  return validated.contents[0] || null
}

/**
 * すべてのカテゴリのスラッグを取得
 * @doc 静的生成のためのスラッグ一覧取得
 * @returns スラッグの配列
 */
export async function getAllCorporateNewsCategorySlugs(): Promise<string[]> {
  const allCategories = await getAllContents<{ id: string; slug: string }>(
    'corporate_news_categories',
    {
      fields: 'id,slug',
    }
  )
  return allCategories.map((c) => c.slug)
}