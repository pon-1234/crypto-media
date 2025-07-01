/**
 * microCMS共通のシステムフィールドスキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'

/**
 * microCMS共通のシステムフィールドスキーマ
 */
export const microCMSBaseSchema = z.object({
  id: z.string().describe('コンテンツID'),
  createdAt: z.string().describe('作成日時'),
  updatedAt: z.string().describe('更新日時'),
  publishedAt: z.string().optional().describe('公開日時'),
  revisedAt: z.string().optional().describe('改訂日時'),
})

/**
 * microCMS共通のシステムフィールド型
 */
export type MicroCMSBase = z.infer<typeof microCMSBaseSchema>

/**
 * microCMSのリスト形式レスポンス型
 */
export interface MicroCMSListResponse<T> {
  contents: T[]
  totalCount: number
  offset: number
  limit: number
}

/**
 * リストレスポンスのスキーマを生成するヘルパー関数
 */
export function createListResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    contents: z.array(itemSchema),
    totalCount: z.number(),
    offset: z.number(),
    limit: z.number(),
  })
}
