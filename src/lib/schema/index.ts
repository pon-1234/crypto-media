/**
 * microCMS スキーマのエントリーポイント
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */

// 基本スキーマ
export {
  microCMSBaseSchema,
  createListResponseSchema,
  type MicroCMSBase,
  type MicroCMSListResponse,
} from './base.schema'

export { microCMSImageSchema, type MicroCMSImage } from './image.schema'

// モデルスキーマ
export {
  corporateNewsSchema,
  type CorporateNews,
} from './corporate-news.schema'

export { expertSchema, type Expert, type ExpertRole } from './expert.schema'

export { categorySchema, type Category } from './category.schema'

export { tagSchema, type Tag } from './tag.schema'

export { featureSchema, type Feature } from './feature.schema'

export {
  mediaArticleSchema,
  type MediaArticle,
  type ArticleType,
  type MembershipLevel,
} from './article.schema'

export { siteSettingsSchema, type SiteSettings } from './site-settings.schema'

export {
  pageCorporateSchema,
  type PageCorporate,
} from './page-corporate.schema'

// リストレスポンススキーマ
import { createListResponseSchema } from './base.schema'
import { corporateNewsSchema } from './corporate-news.schema'
import { expertSchema } from './expert.schema'
import { categorySchema } from './category.schema'
import { tagSchema } from './tag.schema'
import { featureSchema } from './feature.schema'
import { mediaArticleSchema } from './article.schema'
import { pageCorporateSchema } from './page-corporate.schema'

export const corporateNewsListSchema =
  createListResponseSchema(corporateNewsSchema)
export const expertListSchema = createListResponseSchema(expertSchema)
export const categoryListSchema = createListResponseSchema(categorySchema)
export const tagListSchema = createListResponseSchema(tagSchema)
export const featureListSchema = createListResponseSchema(featureSchema)
export const mediaArticleListSchema =
  createListResponseSchema(mediaArticleSchema)
export const pageCorporateListSchema =
  createListResponseSchema(pageCorporateSchema)
