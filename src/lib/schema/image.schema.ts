/**
 * microCMSの画像フィールドスキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'

/**
 * microCMSの画像フィールドスキーマ
 */
export const microCMSImageSchema = z.object({
  url: z.string().url().describe('画像URL'),
  height: z.number().describe('画像の高さ'),
  width: z.number().describe('画像の幅'),
})

/**
 * microCMSの画像フィールド型
 */
export type MicroCMSImage = z.infer<typeof microCMSImageSchema>
