/**
 * サイト設定スキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'
import { microCMSImageSchema } from './image.schema'

/**
 * サイト設定スキーマ（シングルトン）
 * メタタグ、OGP、GA等のグローバル設定
 */
export const siteSettingsSchema = microCMSBaseSchema.extend({
  site_title: z.string().min(1).describe('サイトタイトル'),
  site_description: z.string().min(1).describe('サイトの説明'),
  default_og_image: microCMSImageSchema
    .optional()
    .describe('デフォルトOGP画像'),
  google_analytics_id: z.string().optional().describe('Google Analytics ID'),
  metadata: z
    .string()
    .optional()
    .describe('その他のメタデータ（JSON形式で自由に設定可能）'),
})

/**
 * サイト設定型
 */
export type SiteSettings = z.infer<typeof siteSettingsSchema>
