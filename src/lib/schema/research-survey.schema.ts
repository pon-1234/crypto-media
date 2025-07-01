/**
 * アンケート調査スキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'

/**
 * アンケートrawデータ＋集計スキーマ
 */
export const researchSurveySchema = microCMSBaseSchema.extend({
  title: z.string().min(1).describe('調査タイトル'),
  description: z.string().min(1).describe('調査概要'),
  data: z.string().describe('調査データ（JSON形式）'),
  relatedArticle: z.any().optional().describe('関連する記事'), // 循環参照を避けるためanyを使用
})

/**
 * アンケート調査型
 */
export type ResearchSurvey = z.infer<typeof researchSurveySchema>
