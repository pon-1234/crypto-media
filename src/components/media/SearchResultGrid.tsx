import { ArticleCardWithHighlight } from './ArticleCardWithHighlight'
import type { MediaArticle } from '@/lib/schema/article.schema'

interface SearchResultGridProps {
  articles: MediaArticle[]
  query: string
  className?: string
}

/**
 * 検索結果グリッドコンポーネント
 *
 * @doc 検索結果をグリッド表示
 * @issue #29 - サイト内検索機能の実装
 * @param props - 記事リストと検索キーワード
 * @returns 検索結果グリッド
 */
export function SearchResultGrid({ articles, query, className = '' }: SearchResultGridProps) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {articles.map((article) => (
        <ArticleCardWithHighlight
          key={article.id}
          article={article}
          query={query}
        />
      ))}
    </div>
  )
}