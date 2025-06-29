/**
 * コーポレート固定ページスキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'

/**
 * コーポレート固定ページスキーマ
 */
export const pageCorporateSchema = microCMSBaseSchema.extend({
  title: z.string().min(1).describe('ページタイトル'),
  slug: z.string().min(1).describe('URLスラッグ'),
  content: z.string().min(1).describe('ページ本文'),
})

/**
 * コーポレート固定ページ型
 */
export type PageCorporate = z.infer<typeof pageCorporateSchema>