import Link from 'next/link'
import Image from 'next/image'
import { highlightSearchQuery } from '@/lib/microcms'
import type { MediaArticle } from '@/lib/schema/article.schema'

interface ArticleCardWithHighlightProps {
  article: MediaArticle
  query?: string
}

/**
 * 検索キーワードハイライト付き記事カードコンポーネント
 *
 * @doc 検索結果で使用する記事カード
 * @issue #29 - サイト内検索機能の実装
 * @param props - 記事データと検索キーワード
 * @returns 記事カードコンポーネント
 */
export function ArticleCardWithHighlight({ article, query = '' }: ArticleCardWithHighlightProps) {
  const renderHighlightedText = (text: string) => {
    const parts = query ? highlightSearchQuery(text, query) : [text]
    
    return parts.map((part, index) => {
      if (typeof part === 'string') {
        return part
      }
      return (
        <mark key={part.key} className="bg-yellow-200 dark:bg-yellow-800">
          {part.text}
        </mark>
      )
    })
  }

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg dark:bg-gray-800">
      <Link href={`/media/articles/${article.slug}`} className="block">
        {article.thumbnail && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={article.thumbnail.url}
              alt={article.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {article.membershipLevel === 'paid' && (
              <div className="absolute right-2 top-2 rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white">
                有料会員限定
              </div>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            {article.category && (
              <span className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">
                {article.category.name}
              </span>
            )}
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ja-JP')}
            </time>
          </div>
          
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            {renderHighlightedText(article.title)}
          </h3>
          
          {article.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {renderHighlightedText(article.description)}
            </p>
          )}
          
          {article.tags && article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}