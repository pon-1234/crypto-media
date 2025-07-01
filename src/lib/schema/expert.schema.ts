/**
 * 執筆者・監修者プロファイルスキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'
import { microCMSImageSchema } from './image.schema'

/**
 * 執筆者・監修者のロールスキーマ
 */
const expertRoleSchema = z.enum(['執筆者', '監修者'])

/**
 * 執筆者・監修者のロール型
 */
export type ExpertRole = z.infer<typeof expertRoleSchema>

/**
 * 執筆者・監修者プロファイルスキーマ
 * @see /media/experts/[slug]
 */
export const expertSchema = microCMSBaseSchema.extend({
  name: z.string().min(1).describe('氏名'),
  slug: z.string().min(1).describe('URLスラッグ'),
  role: z.array(expertRoleSchema).describe('役割（複数選択可）'),
  profile: z.string().min(1).describe('プロフィール・経歴'),
  avatar: microCMSImageSchema.optional().describe('プロフィール写真'),
})

/**
 * 執筆者・監修者プロファイル型
 */
export type Expert = z.infer<typeof expertSchema>
