/**
 * メディアニュース詳細ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/36
 * @issue #36 - メディアサイトの主要な一覧ページ実装
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
  getRelatedArticles,
  getOptimizedImageUrl,
} from '@/lib/microcms'
import { ArticleCard } from '@/components/media/ArticleCard'
import { Paywall } from '@/components/media/Paywall'
import { hasAccess } from '@/lib/auth/membership'
import type { MediaArticle } from '@/lib/schema'

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
      title: 'メディアニュース | Crypto Media',
      description:
        '暗号資産・ブロックチェーンに関するニュースの詳細をご覧いただけます。',
    }
  }

  // プレビューモードの確認
  const { isEnabled: isDraftMode } = await draftMode()
  const draftKey = isDraftMode ? searchParams.draftKey : undefined

  const article = await getMediaArticleBySlug(
    params.slug,
    draftKey ? { draftKey } : undefined
  )

  if (!article || article.type !== 'media_news') {
    return {
      title: 'ニュースが見つかりません | Crypto Media',
    }
  }

  const description = DOMPurify.sanitize(article.content, { ALLOWED_TAGS: [] })
    .slice(0, 160)
    .trim()

  return {
    title: `${article.title} | Crypto Media`,
    description: description || '暗号資産・ブロックチェーンに関するニュース',
    openGraph: {
      title: article.title,
      description: description || '暗号資産・ブロックチェーンに関するニュース',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.author ? [article.author.name] : undefined,
      images: article.heroImage
        ? [
            {
              url: getOptimizedImageUrl(article.heroImage.url, {
                width: 1200,
                height: 630,
              }),
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: description || '暗号資産・ブロックチェーンに関するニュース',
    },
  }
}

/**
 * メディアニュース詳細ページコンポーネント
 * @param props - ページプロパティ
 * @returns 記事詳細ページのJSX要素
 */
export default async function MediaNewsDetailPage({
  params,
  searchParams,
}: PageProps) {
  // プレビューモードの確認
  const { isEnabled: isDraftMode } = await draftMode()
  const draftKey = isDraftMode ? searchParams.draftKey : undefined

  let article: MediaArticle | null
  let relatedArticles: MediaArticle[] = []

  try {
    // スラッグから記事を取得
    article = await getMediaArticleBySlug(
      params.slug,
      draftKey ? { draftKey } : undefined
    )

    // typeがmedia_newsでない場合は404
    if (!article || article.type !== 'media_news') {
      notFound()
    }

    // 関連記事を取得（エラーの場合は空配列で継続）
    try {
      relatedArticles = await getRelatedArticles(article, 3)
    } catch (error) {
      console.error('Failed to fetch related articles:', error)
    }
  } catch (error) {
    console.error('Failed to fetch article:', error)
    throw error
  }

  // アクセス権限のチェック
  const canAccess = await hasAccess(article.membershipLevel)

  return (
    <article className="min-h-screen bg-white">
      {/* ヒーローイメージ */}
      {article.heroImage && (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={getOptimizedImageUrl(article.heroImage.url, {
              width: 1200,
              height: 675,
            })}
            alt={article.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* ヘッダー情報 */}
        <header className="mb-8">
          {/* カテゴリ */}
          {article.category && (
            <Link
              href={`/media/category/${article.category.slug}`}
              className="mb-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {article.category.name}
            </Link>
          )}

          {/* タイトル */}
          <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
            {article.title}
          </h1>

          {/* メタ情報 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {/* 公開日 */}
            <time dateTime={article.publishedAt}>
              {format(
                new Date(article.publishedAt || article.createdAt),
                'yyyy年MM月dd日',
                {
                  locale: ja,
                }
              )}
            </time>

            {/* 執筆者 */}
            {article.author && (
              <Link
                href={`/media/experts/${article.author.slug}`}
                className="hover:text-gray-900"
              >
                執筆: {article.author.name}
              </Link>
            )}

            {/* 監修者 */}
            {article.supervisor && (
              <Link
                href={`/media/experts/${article.supervisor.slug}`}
                className="hover:text-gray-900"
              >
                監修: {article.supervisor.name}
              </Link>
            )}

            {/* 会員限定ラベル */}
            {article.membershipLevel === 'paid' && (
              <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                有料会員限定
              </span>
            )}
          </div>

          {/* タグ */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/media/tag/${tag.slug}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* 本文 */}
        {canAccess ? (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.content),
            }}
          />
        ) : (
          <Paywall
            title={article.title}
            preview={DOMPurify.sanitize(
              article.content.substring(0, 300) + '...'
            )}
          />
        )}

        {/* 関連記事 */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
              関連記事
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
