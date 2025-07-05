import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'

/**
 * コーポレートニュースカテゴリのスキーマ
 * @doc コーポレートサイトのニュースカテゴリ管理用のスキーマ定義
 * @related corporate-news.schema.ts
 * @issue #41 - コーポレートニュースのカテゴリ機能
 */
export const corporateNewsCategorySchema = microCMSBaseSchema.extend({
  name: z.string().min(1, 'カテゴリ名は必須です'),
  slug: z.string().min(1, 'スラッグは必須です'),
})

export type CorporateNewsCategory = z.infer<typeof corporateNewsCategorySchema>