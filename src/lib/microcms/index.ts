/**
 * microCMS ライブラリのエントリーポイント
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */

// クライアント
export { defaultQueries, MAX_LIMIT, getOptimizedImageUrl } from './client'

// ユーティリティ
export { getAllContents, stripHtmlTags } from './utils'

// スキーマとバリデーション
export {
  // スキーマ
  corporateNewsSchema,
  expertSchema,
  categorySchema,
  tagSchema,
  featureSchema,
  mediaArticleSchema,
  siteSettingsSchema,
  researchSurveySchema,
  pageCorporateSchema,

  // リストレスポンススキーマ
  corporateNewsListSchema,
  expertListSchema,
  categoryListSchema,
  tagListSchema,
  featureListSchema,
  mediaArticleListSchema,
  researchSurveyListSchema,
  pageCorporateListSchema,

  // ヘルパー関数
  createListResponseSchema,

  // 型
  type CorporateNews,
  type Expert,
  type Category,
  type Tag,
  type Feature,
  type MediaArticle,
  type SiteSettings,
  type ResearchSurvey,
  type PageCorporate,
} from '@/lib/schema'

// 追加の型エクスポート
export type {
  MicroCMSBase,
  MicroCMSListResponse,
  MicroCMSImage,
  ExpertRole,
  ArticleType,
  MembershipLevel,
} from '@/lib/schema'

// APIメソッド
export {
  getCorporateNewsList,
  getCorporateNewsDetail,
  getAllCorporateNewsIds,
} from './corporate-news'

export {
  getMediaArticlesList,
  getMediaArticleDetail,
  getMediaArticleBySlug,
  getAllMediaArticleIds,
  getAllMediaArticleSlugs,
  getMediaArticlesByCategory,
  getMediaArticlesByTag,
  getRelatedArticles,
  getMediaArticlesByAuthor,
  getMediaArticlesBySupervisor,
  getMediaArticlesByFeature,
} from './media-articles'

export { getCategories, getCategoryBySlug, getCategoryById } from './categories'

export { getTags, getTagBySlug, getTagById } from './tags'

export {
  getExperts,
  getExpertById,
  getExpertBySlug,
  getAllExpertIds,
  getAllExpertSlugs,
} from './experts'

export {
  getFeatures,
  getFeatureById,
  getFeatureBySlug,
  getAllFeatureIds,
  getAllFeatureSlugs,
} from './features'
