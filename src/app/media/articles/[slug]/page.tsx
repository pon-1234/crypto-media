/**
 * メディア記事詳細ページ
 * @doc DEVELOPMENT_GUIDE.md#メディア記事詳細
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import DOMPurify from 'isomorphic-dompurify'
import { draftMode } from 'next/headers'
import {
  getMediaArticleBySlug,
  getMediaArticleDetail,
  getAllMediaArticleSlugs,
  getRelatedArticles,
  getOptimizedImageUrl,
} from '@/lib/microcms'
import { ArticleCard } from '@/components/media/ArticleCard'
import { Paywall } from '@/components/media/Paywall'
import { hasAccess } from '@/lib/auth/membership'

/**
 * ISR（Incremental Static Regeneration）設定
 * 1時間ごとにページを再生成
 */
export const revalidate = 3600

/**
 * 動的ルートのパラメータ型
 */
interface PageProps {
  params: {
    slug: string
  }
  searchParams: {
    draftKey?: string
  }
}

/**
 * 静的生成のためのパラメータを生成
 * @returns slugパラメータの配列
 */
export async function generateStaticParams() {
  // CI環境では静的パラメータ生成をスキップ
  if (process.env.CI === 'true') {
    return []
  }

  const slugs = await getAllMediaArticleSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

/**
 * 動的メタデータを生成
 * @param props - ページプロパティ
 * @returns メタデータ
 */
export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  // CI環境ではデフォルトメタデータを返す
  if (process.env.CI === 'true') {
    return {
      title: 'メディア記事 | Crypto Media',
      description:
        '暗号資産・ブロックチェーンに関するメディア記事の詳細をご覧いただけます。',
    }
  }

  // プレビューモードの確認
  const { isEnabled: isDraftMode } = await draftMode()
  const draftKey = isDraftMode ? searchParams.draftKey : undefined

  const article = await getMediaArticleBySlug(params.slug, draftKey ? { draftKey } : undefined)

  if (!article) {
    return {
      title: '記事が見つかりません | Crypto Media',
    }
  }

  const description = DOMPurify.sanitize(article.content, { ALLOWED_TAGS: [] })
    .slice(0, 160)
    .trim()

  return {
    title: `${article.title} | Crypto Media`,
    description,
    openGraph: {
      title: `${article.title} | Crypto Media`,
      description,
      type: 'article',
      url: `/media/articles/${article.slug}`,
      images: [
        {
          url: article.heroImage.url,
          width: article.heroImage.width,
          height: article.heroImage.height,
          alt: article.title,
        },
      ],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.author ? [article.author.name] : undefined,
      tags: article.tags?.map((tag) => tag.name),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | Crypto Media`,
      description,
      images: [article.heroImage.url],
    },
  }
}

/**
 * 記事詳細ページコンポーネント
 * @param props - ページプロパティ
 * @returns 記事詳細ページのJSX要素
 */
export default async function MediaArticleDetailPage({ params, searchParams }: PageProps) {
  // CI環境かつテスト実行中でない場合のみダミーページを返す
  if (process.env.CI === 'true' && process.env.NODE_ENV !== 'test') {
    return (
      <article className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold">メディア記事詳細</h1>
            <p className="text-gray-600">
              CI環境でのビルド用ダミーページです。
            </p>
          </div>
        </div>
      </article>
    )
  }

  // プレビューモードの確認
  const { isEnabled: isDraftMode } = await draftMode()
  const draftKey = isDraftMode ? searchParams.draftKey : undefined

  let article
  let relatedArticles = []

  try {
    // プレビューモード時はIDベースでの取得も試みる
    if (isDraftMode && draftKey && params.slug.match(/^[a-zA-Z0-9_-]+$/)) {
      try {
        // まずIDとして取得を試みる
        article = await getMediaArticleDetail(params.slug, { draftKey })
      } catch {
        // IDでの取得に失敗したらslugとして取得
        article = await getMediaArticleBySlug(params.slug, { draftKey })
      }
    } else {
      // 通常モードではslugで取得
      article = await getMediaArticleBySlug(params.slug)
    }

    if (!article) {
      notFound()
    }

    // 関連記事を取得
    relatedArticles = await getRelatedArticles(article, 3)
  } catch (error) {
    console.error('Failed to fetch article or related articles:', error)
    throw error // Next.jsのエラーバウンダリーに委譲
  }

  // 公開日をフォーマット
  const publishedDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'yyyy年MM月dd日', { locale: ja })
    : ''

  // 記事タイプラベルを取得
  const articleTypeLabel = getArticleTypeLabel(article.type)

  // HTMLコンテンツをサニタイズ
  const sanitizedContent = DOMPurify.sanitize(article.content)

  // ユーザーのアクセス権限をチェック
  const userHasAccess = await hasAccess(article.membershipLevel)

  // 構造化データ（JSON-LD）を生成
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.heroImage.url,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author.name,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Crypto Media',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.co.jp/logo.png', // TODO: 実際のロゴURLに置き換える
      },
    },
    description: DOMPurify.sanitize(article.content, { ALLOWED_TAGS: [] })
      .slice(0, 160)
      .trim(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://example.co.jp/media/articles/${article.slug}`,
    },
  }

  // 有料記事の場合は構造化データにペイウォール情報を追加
  if (article.membershipLevel === 'paid') {
    structuredData.isAccessibleForFree = 'False'
    structuredData.hasPart = [
      {
        '@type': 'WebPageElement',
        isAccessibleForFree: 'False',
        cssSelector: '.article-body',
      },
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="min-h-screen bg-white">
        {/* ヒーローセクション */}
        <div className="relative h-[300px] w-full sm:h-[400px] md:h-[500px]">
          <Image
            src={getOptimizedImageUrl(article.heroImage.url, {
              width: 1200,
              height: 630,
              format: 'webp',
            })}
            alt={article.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-4">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white sm:px-3 sm:py-1 sm:text-sm">
                  {articleTypeLabel}
                </span>
                {article.membershipLevel === 'paid' && (
                  <span className="rounded bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white sm:px-3 sm:py-1 sm:text-sm">
                    有料会員限定
                  </span>
                )}
                {article.publishedAt && (
                  <time
                    dateTime={article.publishedAt}
                    className="text-xs sm:text-sm"
                  >
                    {publishedDate}
                  </time>
                )}
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
                {article.title}
              </h1>
            </div>
          </div>
        </div>

        {/* 記事コンテンツ */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2">
              {/* 執筆者・監修者情報 */}
              <div className="mb-6 border-b border-gray-200 pb-6 sm:mb-8 sm:pb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
                  {article.author && (
                    <div className="flex items-center gap-3">
                      {article.author.avatar && (
                        <Image
                          src={getOptimizedImageUrl(article.author.avatar.url, {
                            width: 48,
                            height: 48,
                            format: 'webp',
                          })}
                          alt={article.author.name}
                          width={48}
                          height={48}
                          className="h-10 w-10 rounded-full sm:h-12 sm:w-12"
                        />
                      )}
                      <div>
                        <p className="text-xs text-gray-600 sm:text-sm">
                          執筆者
                        </p>
                        <p className="text-sm font-medium sm:text-base">
                          {article.author.name}
                        </p>
                      </div>
                    </div>
                  )}
                  {article.supervisor && (
                    <div className="flex items-center gap-3">
                      {article.supervisor.avatar && (
                        <Image
                          src={getOptimizedImageUrl(
                            article.supervisor.avatar.url,
                            {
                              width: 48,
                              height: 48,
                              format: 'webp',
                            }
                          )}
                          alt={article.supervisor.name}
                          width={48}
                          height={48}
                          className="h-10 w-10 rounded-full sm:h-12 sm:w-12"
                        />
                      )}
                      <div>
                        <p className="text-xs text-gray-600 sm:text-sm">
                          監修者
                        </p>
                        <p className="text-sm font-medium sm:text-base">
                          {article.supervisor.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 記事本文またはペイウォール */}
              <div className="article-body">
                {userHasAccess ? (
                  <div
                    className="prose prose-sm sm:prose-base lg:prose-lg mb-8 max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />
                ) : (
                  <div className="mb-8">
                    <Paywall
                      title={article.title}
                      preview={
                        article.previewContent ||
                        sanitizedContent.slice(0, 500) + '...'
                      }
                      isHtml={true}
                    />
                  </div>
                )}
              </div>

              {/* タグ */}
              {article.tags && article.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-base font-bold sm:text-lg">
                    関連タグ
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/media/tag/${tag.slug}`}
                        className="inline-block rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200 sm:px-3"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* サイドバー */}
            <aside className="lg:col-span-1">
              {/* カテゴリ */}
              {article.category && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">
                    カテゴリ
                  </h3>
                  <Link
                    href={`/media/category/${article.category.slug}`}
                    className="inline-block rounded bg-blue-100 px-3 py-1.5 text-sm text-blue-700 transition-colors hover:bg-blue-200 sm:px-4 sm:py-2 sm:text-base"
                  >
                    {article.category.name}
                  </Link>
                </div>
              )}

              {/* 特集 */}
              {article.features && article.features.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">
                    関連特集
                  </h3>
                  <ul className="space-y-2">
                    {article.features.map((feature) => (
                      <li key={feature.id}>
                        <Link
                          href={`/media/feature/${feature.slug}`}
                          className="text-sm text-blue-600 hover:underline sm:text-base"
                        >
                          {feature.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 関連記事 */}
              {relatedArticles.length > 0 && (
                <div>
                  <h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">
                    関連記事
                  </h3>
                  <div className="space-y-4">
                    {relatedArticles.map((relatedArticle) => (
                      <ArticleCard
                        key={relatedArticle.id}
                        article={relatedArticle}
                        className="shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* プレビューモード時の終了リンク */}
          {isDraftMode && (
            <div className="fixed bottom-4 right-4 z-50">
              <Link
                href={`/api/exit-preview?redirect=/media/articles/${article.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-red-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                プレビューモードを終了
              </Link>
            </div>
          )}
        </div>
      </article>
    </>
  )
}

/**
 * 記事タイプからラベル文字列を取得
 * @param type - 記事タイプ
 * @returns ラベル文字列
 */
function getArticleTypeLabel(type: string): string {
  switch (type) {
    case 'article':
      return '記事'
    case 'survey_report':
      return '調査レポート'
    case 'media_news':
      return 'お知らせ'
    default:
      return '記事'
  }
}
