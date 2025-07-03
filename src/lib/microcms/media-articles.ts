/**
 * メディア記事のAPIメソッド
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import { client, defaultQueries } from './client'
import {
  mediaArticleSchema,
  mediaArticleListSchema,
  type MediaArticle,
  type MicroCMSListResponse,
} from '@/lib/schema'
import type { MicroCMSQueries } from 'microcms-js-sdk'

/**
 * メディア記事一覧を取得
 * @param queries - microCMSのクエリパラメータ
 * @returns 記事一覧レスポンス
 */
export async function getMediaArticlesList(
  queries?: MicroCMSQueries
): Promise<MicroCMSListResponse<MediaArticle>> {
  const response = await client.getList({
    endpoint: 'media_articles',
    queries: {
      ...defaultQueries,
      ...queries,
    },
  })

  return mediaArticleListSchema.parse(response)
}

/**
 * メディア記事詳細を取得
 * @param contentId - 記事ID（またはslug）
 * @param queries - microCMSのクエリパラメータ（プレビュー用draftKey等）
 * @returns 記事詳細
 */
export async function getMediaArticleDetail(
  contentId: string,
  queries?: MicroCMSQueries
): Promise<MediaArticle> {
  const response = await client.get({
    endpoint: 'media_articles',
    contentId,
    queries,
  })

  return mediaArticleSchema.parse(response)
}

/**
 * スラッグから記事詳細を取得
 * @param slug - 記事のスラッグ
 * @param queries - microCMSのクエリパラメータ
 * @returns 記事詳細（見つからない場合はnull）
 */
export async function getMediaArticleBySlug(
  slug: string,
  queries?: MicroCMSQueries
): Promise<MediaArticle | null> {
  const response = await client.getList({
    endpoint: 'media_articles',
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
      ...queries,
    },
  })

  const parsed = mediaArticleListSchema.parse(response)
  return parsed.contents[0] || null
}

/**
 * すべての記事IDを取得（静的生成用）
 * @returns 記事IDの配列
 */
export async function getAllMediaArticleIds(): Promise<string[]> {
  const allIds: string[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const response = await client.getList({
      endpoint: 'media_articles',
      queries: {
        fields: 'id',
        limit,
        offset,
      },
    })

    allIds.push(
      ...response.contents.map((content: { id: string }) => content.id)
    )

    if (response.offset + response.limit >= response.totalCount) {
      break
    }

    offset += limit
  }

  return allIds
}

/**
 * すべての記事スラッグを取得（静的生成用）
 * @returns 記事スラッグの配列
 */
export async function getAllMediaArticleSlugs(): Promise<string[]> {
  const allSlugs: string[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const response = await client.getList({
      endpoint: 'media_articles',
      queries: {
        fields: 'slug',
        limit,
        offset,
      },
    })

    allSlugs.push(
      ...response.contents.map((content: { slug: string }) => content.slug)
    )

    if (response.offset + response.limit >= response.totalCount) {
      break
    }

    offset += limit
  }

  return allSlugs
}

/**
 * カテゴリごとの記事一覧を取得
 * @param categorySlug - カテゴリのスラッグ
 * @param queries - microCMSのクエリパラメータ
 * @returns 記事一覧レスポンス
 */
export async function getMediaArticlesByCategory(
  categorySlug: string,
  queries?: MicroCMSQueries
): Promise<MicroCMSListResponse<MediaArticle>> {
  const response = await client.getList({
    endpoint: 'media_articles',
    queries: {
      filters: `category.slug[equals]${categorySlug}`,
      ...defaultQueries,
      ...queries,
    },
  })

  return mediaArticleListSchema.parse(response)
}

/**
 * タグごとの記事一覧を取得
 * @param tagSlug - タグのスラッグ
 * @param queries - microCMSのクエリパラメータ
 * @returns 記事一覧レスポンス
 */
export async function getMediaArticlesByTag(
  tagSlug: string,
  queries?: MicroCMSQueries
): Promise<MicroCMSListResponse<MediaArticle>> {
  const response = await client.getList({
    endpoint: 'media_articles',
    queries: {
      filters: `tags[contains]${tagSlug}`,
      ...defaultQueries,
      ...queries,
    },
  })

  return mediaArticleListSchema.parse(response)
}

/**
 * 関連記事を取得
 * @param article - 現在の記事
 * @param limit - 取得数（デフォルト: 3）
 * @returns 関連記事リスト
 */
export async function getRelatedArticles(
  article: MediaArticle,
  limit: number = 3
): Promise<MediaArticle[]> {
  // 同じカテゴリの記事を取得（現在の記事を除く）
  if (article.category) {
    const response = await client.getList({
      endpoint: 'media_articles',
      queries: {
        filters: `category.id[equals]${article.category.id}[and]id[not_equals]${article.id}`,
        limit,
        orders: '-publishedAt',
      },
    })

    const parsed = mediaArticleListSchema.parse(response)

    // 指定数に満たない場合は最新記事で補完
    if (parsed.contents.length < limit) {
      const additionalResponse = await client.getList({
        endpoint: 'media_articles',
        queries: {
          filters: `id[not_equals]${article.id}`,
          limit: limit - parsed.contents.length,
          orders: '-publishedAt',
        },
      })

      const additionalParsed = mediaArticleListSchema.parse(additionalResponse)
      return [...parsed.contents, ...additionalParsed.contents]
    }

    return parsed.contents
  }

  // カテゴリがない場合は最新記事を取得
  const response = await client.getList({
    endpoint: 'media_articles',
    queries: {
      filters: `id[not_equals]${article.id}`,
      limit,
      orders: '-publishedAt',
    },
  })

  const parsed = mediaArticleListSchema.parse(response)
  return parsed.contents
}

/**
 * 執筆者による記事一覧を取得
 * @param authorId 執筆者ID
 * @param queries クエリパラメータ
 * @returns 記事一覧
 */
export async function getMediaArticlesByAuthor(
  authorId: string,
  queries?: MicroCMSQueries
) {
  const data = await client.getList({
    endpoint: 'media_articles',
    queries: {
      ...defaultQueries,
      ...queries,
      filters: `author[equals]${authorId}`,
    },
  })
  return mediaArticleListSchema.parse(data)
}

/**
 * 監修者による記事一覧を取得
 * @param supervisorId 監修者ID
 * @param queries クエリパラメータ
 * @returns 記事一覧
 */
export async function getMediaArticlesBySupervisor(
  supervisorId: string,
  queries?: MicroCMSQueries
) {
  const data = await client.getList({
    endpoint: 'media_articles',
    queries: {
      ...defaultQueries,
      ...queries,
      filters: `supervisor[equals]${supervisorId}`,
    },
  })
  return mediaArticleListSchema.parse(data)
}

/**
 * 特集に属する記事一覧を取得
 * @param featureId 特集ID
 * @param queries クエリパラメータ
 * @returns 記事一覧
 */
export async function getMediaArticlesByFeature(
  featureId: string,
  queries?: MicroCMSQueries
) {
  const data = await client.getList({
    endpoint: 'media_articles',
    queries: {
      ...defaultQueries,
      ...queries,
      filters: `features[contains]${featureId}`,
    },
  })
  return mediaArticleListSchema.parse(data)
}

/**
 * 記事タイプごとの記事一覧を取得
 * @param type 記事タイプ (article | survey_report | media_news)
 * @param queries クエリパラメータ
 * @returns 記事一覧
 * @issue #36 - メディアサイトの主要な一覧ページ実装
 */
export async function getMediaArticlesByType(
  type: 'article' | 'survey_report' | 'media_news',
  queries?: MicroCMSQueries
) {
  const data = await client.getList({
    endpoint: 'media_articles',
    queries: {
      ...defaultQueries,
      ...queries,
      filters: `type[equals]${type}`,
    },
  })
  return mediaArticleListSchema.parse(data)
}

/**
 * 会員レベルごとの記事一覧を取得
 * @param membershipLevel 会員レベル (public | paid)
 * @param queries クエリパラメータ
 * @returns 記事一覧
 * @issue #36 - メディアサイトの主要な一覧ページ実装
 */
export async function getMediaArticlesByMembershipLevel(
  membershipLevel: 'public' | 'paid',
  queries?: MicroCMSQueries
) {
  const data = await client.getList({
    endpoint: 'media_articles',
    queries: {
      ...defaultQueries,
      ...queries,
      filters: `membershipLevel[equals]${membershipLevel}`,
    },
  })
  return mediaArticleListSchema.parse(data)
}
