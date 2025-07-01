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
import {
  getMediaArticleBySlug,
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
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // CI環境ではデフォルトメタデータを返す
  if (process.env.CI === 'true') {
    return {
      title: 'メディア記事 | Crypto Media',
      description: '暗号資産・ブロックチェーンに関するメディア記事の詳細をご覧いただけます。',
    }
  }

  const article = await getMediaArticleBySlug(params.slug)

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
export default async function MediaArticleDetailPage({ params }: PageProps) {
  // CI環境ではダミーページを返す
  if (process.env.CI === 'true') {
    return (
      <article className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">メディア記事詳細</h1>
            <p className="text-gray-600">CI環境でのビルド用ダミーページです。</p>
          </div>
        </div>
      </article>
    )
  }

  let article
  let relatedArticles = []

  try {
    article = await getMediaArticleBySlug(params.slug)

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
  const publishedDate = article.publishedAt ? format(new Date(article.publishedAt), 'yyyy年MM月dd日', { locale: ja }) : ''

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
    author: article.author ? {
      '@type': 'Person',
      name: article.author.name,
    } : undefined,
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
    structuredData.hasPart = [{
      '@type': 'WebPageElement',
      isAccessibleForFree: 'False',
      cssSelector: '.article-body',
    }]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <div className="relative w-full h-[400px] md:h-[500px]">
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
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded">
                {articleTypeLabel}
              </span>
              {article.membershipLevel === 'paid' && (
                <span className="bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded">
                  有料会員限定
                </span>
              )}
              {article.publishedAt && (
                <time dateTime={article.publishedAt} className="text-sm">
                  {publishedDate}
                </time>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          </div>
        </div>
      </div>

      {/* 記事コンテンツ */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            {/* 執筆者・監修者情報 */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex flex-wrap gap-6">
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
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">執筆者</p>
                      <p className="font-medium">{article.author.name}</p>
                    </div>
                  </div>
                )}
                {article.supervisor && (
                  <div className="flex items-center gap-3">
                    {article.supervisor.avatar && (
                      <Image
                        src={getOptimizedImageUrl(article.supervisor.avatar.url, {
                          width: 48,
                          height: 48,
                          format: 'webp',
                        })}
                        alt={article.supervisor.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">監修者</p>
                      <p className="font-medium">{article.supervisor.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 記事本文またはペイウォール */}
            <div className="article-body">
              {userHasAccess ? (
                <div
                  className="prose prose-lg max-w-none mb-8"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              ) : (
                <div className="mb-8">
                  <Paywall
                    title={article.title}
                    preview={article.previewContent || sanitizedContent.slice(0, 500) + '...'}
                    isHtml={true}
                  />
                </div>
              )}
            </div>

            {/* タグ */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">関連タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/media/tag/${tag.slug}`}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
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
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">カテゴリ</h3>
                <Link
                  href={`/media/category/${article.category.slug}`}
                  className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition-colors"
                >
                  {article.category.name}
                </Link>
              </div>
            )}

            {/* 特集 */}
            {article.features && article.features.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">関連特集</h3>
                <ul className="space-y-2">
                  {article.features.map((feature) => (
                    <li key={feature.id}>
                      <Link
                        href={`/media/feature/${feature.slug}`}
                        className="text-blue-600 hover:underline"
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
                <h3 className="text-lg font-bold mb-4">関連記事</h3>
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