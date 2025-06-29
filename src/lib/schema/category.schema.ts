/**
 * メディア記事カテゴリスキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'

/**
 * メディア記事カテゴリスキーマ
 * @see /media/category/[slug]
 */
export const categorySchema = microCMSBaseSchema.extend({
  name: z.string().min(1).describe('カテゴリ名'),
  slug: z.string().min(1).describe('URLスラッグ'),
})

/**
 * メディア記事カテゴリ型
 */
export type Category = z.infer<typeof categorySchema>