/**
 * メディア記事タグスキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'

/**
 * メディア記事タグスキーマ
 * @see /media/tag/[slug]
 */
export const tagSchema = microCMSBaseSchema.extend({
  name: z.string().min(1).describe('タグ名'),
  slug: z.string().min(1).describe('URLスラッグ'),
})

/**
 * メディア記事タグ型
 */
export type Tag = z.infer<typeof tagSchema>