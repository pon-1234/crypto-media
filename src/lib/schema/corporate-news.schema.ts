/**
 * コーポレートサイト用のお知らせスキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'
import { corporateNewsCategorySchema } from './corporate-news-category.schema'

/**
 * コーポレートサイト用のお知らせスキーマ
 * @see /news/
 */
export const corporateNewsSchema = microCMSBaseSchema.extend({
  title: z.string().min(1).describe('お知らせのタイトル'),
  content: z.string().min(1).describe('お知らせの本文'),
  category: corporateNewsCategorySchema.optional().describe('お知らせのカテゴリ'),
})

/**
 * コーポレートサイト用のお知らせ型
 */
export type CorporateNews = z.infer<typeof corporateNewsSchema>
