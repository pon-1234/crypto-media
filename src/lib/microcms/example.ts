/**
 * microCMS APIの使用例
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { client, defaultQueries, getOptimizedImageUrl } from './client'
import {
  mediaArticleSchema,
  mediaArticleListSchema,
  siteSettingsSchema,
  type MediaArticle,
  type SiteSettings,
} from './index'

/**
 * 記事一覧を取得する例
 */
export async function getArticles(limit = 10): Promise<MediaArticle[]> {
  try {
    const response = await client.get({
      endpoint: 'media_articles',
      queries: {
        ...defaultQueries,
        limit,
      },
    })

    // zodでバリデーション
    const validated = mediaArticleListSchema.parse(response)
    return validated.contents
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    throw error
  }
}

/**
 * 特定の記事を取得する例（改善版）
 * slugで記事を検索し、見つからない場合はnullを返す
 */
export async function getArticleBySlug(
  slug: string
): Promise<MediaArticle | null> {
  try {
    const response = await client.get({
      endpoint: 'media_articles',
      queries: {
        filters: `slug[equals]${slug}`,
        limit: 1,
      },
    })

    const validated = mediaArticleListSchema.parse(response)

    // 記事が見つからない場合
    if (validated.totalCount === 0) {
      return null
    }

    // 念のため、totalCountが1であることを確認
    if (validated.totalCount !== 1) {
      console.warn(
        `Expected 1 article with slug "${slug}", but found ${validated.totalCount}`
      )
    }

    return validated.contents[0]
  } catch (error) {
    // microCMSのエラーレスポンスを適切に処理
    if (error instanceof Error && 'response' in error) {
      const httpError = error as Error & { response?: { status: number } }
      if (httpError.response?.status === 404) {
        return null
      }
    }

    console.error('Failed to fetch article:', error)
    throw error
  }
}

/**
 * プレビュー用に記事を取得する例
 */
export async function getArticlePreview(
  contentId: string,
  draftKey: string
): Promise<MediaArticle> {
  try {
    const response = await client.get({
      endpoint: 'media_articles',
      contentId,
      queries: {
        draftKey,
      },
    })

    // 単一記事のバリデーション
    const validated = mediaArticleSchema.parse(response)
    return validated
  } catch (error) {
    console.error('Failed to fetch preview:', error)
    throw error
  }
}

/**
 * 有料会員向け記事のみを取得する例
 */
export async function getPaidArticles(): Promise<MediaArticle[]> {
  try {
    const response = await client.get({
      endpoint: 'media_articles',
      queries: {
        ...defaultQueries,
        filters: 'membershipLevel[equals]paid',
      },
    })

    const validated = mediaArticleListSchema.parse(response)
    return validated.contents
  } catch (error) {
    console.error('Failed to fetch paid articles:', error)
    throw error
  }
}

/**
 * 画像URLを最適化する例
 */
export function getOptimizedArticleImage(article: MediaArticle) {
  if (!article.heroImage) return null

  return {
    // デスクトップ用
    desktop: getOptimizedImageUrl(article.heroImage.url, {
      width: 1200,
      format: 'webp',
      quality: 85,
    }),
    // モバイル用
    mobile: getOptimizedImageUrl(article.heroImage.url, {
      width: 600,
      format: 'webp',
      quality: 85,
    }),
    // OGP用
    ogp: getOptimizedImageUrl(article.heroImage.url, {
      width: 1200,
      height: 630,
      format: 'jpg',
      quality: 90,
    }),
  }
}

/**
 * サイト設定を取得する例（シングルトンAPI）
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const response = await client.get({
      endpoint: 'site_settings',
    })

    // シングルトンAPIはオブジェクトを直接返す
    const validated = siteSettingsSchema.parse(response)
    return validated
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
    throw error
  }
}
