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
const articleTypeSchema = z.enum(['article', 'survey_report', 'media_news'])

/**
 * 記事のタイプ型
 */
export type ArticleType = z.infer<typeof articleTypeSchema>

/**
 * 会員レベル（アクセス制御）
 */
const membershipLevelSchema = z.enum(['public', 'paid'])

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
  type: z.union([
    articleTypeSchema,
    z.array(articleTypeSchema).transform(arr => arr[0] || 'article') // 配列の場合は最初の要素を使用、空の場合はデフォルト値
  ]).describe(
    '記事タイプ - article: 通常記事, survey_report: 調査レポート, media_news: メディアお知らせ'
  ),
  membershipLevel: z.union([
    membershipLevelSchema,
    z.array(z.string()).transform(arr => {
      // 配列の最初の要素から値を抽出
      const value = arr[0]
      if (!value) return 'public'
      
      // "paid (有料会員限定)" -> "paid"
      // "public (全員公開)" -> "public"
      if (value.includes('paid')) return 'paid'
      if (value.includes('public')) return 'public'
      
      return 'public' // デフォルト値
    })
  ]).describe(
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
