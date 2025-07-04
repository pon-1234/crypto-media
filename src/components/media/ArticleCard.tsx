/**
 * 記事カードコンポーネント
 * @doc DEVELOPMENT_GUIDE.md#メディア記事一覧
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { MediaArticle } from '@/lib/schema'
import { getOptimizedImageUrl } from '@/lib/microcms'

/**
 * 記事カードのプロパティ
 */
export interface ArticleCardProps {
  /** 記事データ */
  article: MediaArticle
  /** カスタムクラス名 */
  className?: string
}

/**
 * 記事カードコンポーネント
 * @param props - コンポーネントのプロパティ
 * @returns 記事カードのJSX要素
 */
export function ArticleCard({ article, className = '' }: ArticleCardProps) {
  const publishedDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'yyyy年MM月dd日', { locale: ja })
    : ''
  const articleTypeLabel = getArticleTypeLabel(article.type)
  const optimizedImageUrl = getOptimizedImageUrl(article.heroImage.url, {
    width: 640,
    height: 360,
    format: 'webp',
  })

  return (
    <article
      className={`overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg ${className}`}
    >
      <Link href={`/media/articles/${article.slug}`} className="block">
        {/* ヒーロー画像 */}
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={optimizedImageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
          {/* 記事タイプラベル */}
          <div className="absolute left-2 top-2">
            <span className="rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white">
              {articleTypeLabel}
            </span>
          </div>
          {/* 有料会員限定ラベル */}
          {article.membershipLevel === 'paid' && (
            <div className="absolute right-2 top-2">
              <span className="rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white">
                有料会員限定
              </span>
            </div>
          )}
        </div>

        {/* 記事情報 */}
        <div className="space-y-3 p-4">
          {/* カテゴリと公開日 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            {article.category && (
              <span className="font-medium text-blue-600">
                {article.category.name}
              </span>
            )}
            {article.publishedAt && (
              <time dateTime={article.publishedAt}>{publishedDate}</time>
            )}
          </div>

          {/* タイトル */}
          <h3 className="line-clamp-2 text-lg font-bold text-gray-900 transition-colors hover:text-blue-600">
            {article.title}
          </h3>

          {/* タグ */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  #{tag.name}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{article.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 執筆者情報 */}
          {article.author && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {article.author.avatar && (
                <Image
                  src={getOptimizedImageUrl(article.author.avatar.url, {
                    width: 24,
                    height: 24,
                    format: 'webp',
                  })}
                  alt={article.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span>{article.author.name}</span>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}

/**
 * 記事タイプからラベル文字列を取得
 * @param type - 記事タイプ
 * @returns ラベル文字列
 */
function getArticleTypeLabel(type: MediaArticle['type']): string {
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
