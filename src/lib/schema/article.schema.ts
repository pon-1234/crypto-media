/**
 * メディア記事スキーマ
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { z } from 'zod'
import { microCMSBaseSchema } from './base.schema'
import { microCMSImageSchema } from './image.schema'
import { categorySchema } from './category.schema'
import { tagSchema } from './tag.schema'
import { expertSchema } from './expert.schema'
import { featureSchema } from './feature.schema'

/**
 * 記事のタイプ
 */
const articleTypeSchema = z
  .array(z.enum(['article', 'survey_report', 'media_news']))
  .transform((val) => val[0])

/**
 * 記事のタイプ型
 */
export type ArticleType = z.infer<typeof articleTypeSchema>

/**
 * 会員レベル（アクセス制御）
 */
const membershipLevelSchema = z
  .array(
    z.preprocess(
      (arg) => (typeof arg === 'string' ? arg.split(' ')[0] : arg),
      z.enum(['public', 'paid'])
    )
  )
  .transform((val) => val[0])

/**
 * 会員レベル型
 */
export type MembershipLevel = z.infer<typeof membershipLevelSchema>

/**
 * メディアサイトの記事・お知らせ等スキーマ
 * @see /media/articles/[slug]
 */
export const mediaArticleSchema = microCMSBaseSchema.extend({
  title: z.string().min(1).describe('記事タイトル'),
  slug: z.string().min(1).describe('URLスラッグ'),
  type: articleTypeSchema.describe(
    '記事タイプ - article: 通常記事, survey_report: 調査レポート, media_news: メディアお知らせ'
  ),
  membershipLevel: membershipLevelSchema.describe(
    'アクセスレベル - public: 全ユーザー, paid: 有料会員のみ'
  ),
  content: z.string().min(1).describe('記事本文'),
  heroImage: microCMSImageSchema.describe('メイン画像（OGPにも使用）'),
  category: categorySchema.optional().describe('カテゴリ（単一参照）'),
  tags: z.array(tagSchema).optional().describe('タグ（複数参照）'),
  author: expertSchema.optional().describe('主執筆者'),
  supervisor: expertSchema.optional().describe('主監修者'),
  features: z.array(featureSchema).optional().describe('所属する特集'),
  previewContent: z
    .string()
    .optional()
    .describe('プレビューコンテンツ（有料記事の非会員向けティザー）'),
  paywallCTA: z
    .string()
    .optional()
    .describe(
      'ペイウォールCTAテキスト（カスタムCTA、空の場合はデフォルト使用）'
    ),
})

/**
 * メディア記事型
 */
export type MediaArticle = z.infer<typeof mediaArticleSchema>
