/**
 * 特集記事スキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'
import { microCMSImageSchema } from './image.schema'

/**
 * 特集記事スキーマ（複数の記事をまとめる）
 * @see /media/feature/[slug]
 */
export const featureSchema = microCMSBaseSchema.extend({
  name: z.string().min(1).describe('特集名'),
  slug: z.string().min(1).describe('URLスラッグ'),
  description: z.string().min(1).describe('特集の概要説明'),
  heroImage: microCMSImageSchema.optional().describe('特集ページのメイン画像'),
})

/**
 * 特集記事型
 */
export type Feature = z.infer<typeof featureSchema>