/**
 * メディア記事一覧ページ
 * @doc DEVELOPMENT_GUIDE.md#メディア記事一覧
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import { Metadata } from 'next'
import { getMediaArticlesList } from '@/lib/microcms'
import { ArticleCard } from '@/components/media/ArticleCard'

/**
 * ISR（Incremental Static Regeneration）設定
 * 1時間ごとにページを再生成
 */
export const revalidate = 3600

/**
 * ページメタデータ
 */
export const metadata: Metadata = {
  title: '記事一覧 | Crypto Media',
  description: '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。',
  openGraph: {
    title: '記事一覧 | Crypto Media',
    description: '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。',
    type: 'website',
    url: '/media/articles',
  },
  twitter: {
    card: 'summary_large_image',
    title: '記事一覧 | Crypto Media',
    description: '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。',
  },
}

/**
 * 記事一覧ページコンポーネント
 * @returns 記事一覧ページのJSX要素
 */
export default async function MediaArticlesPage() {
  let articlesResponse

  try {
    // 記事一覧を取得（この時点ではmembershipLevelは無視）
    articlesResponse = await getMediaArticlesList({
      limit: 20,
      orders: '-publishedAt',
    })
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    throw error // Next.jsのエラーバウンダリーに委譲
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">記事一覧</h1>
          <p className="text-gray-600">
            暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。
          </p>
        </div>

        {/* 記事一覧 */}
        {articlesResponse.contents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articlesResponse.contents.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* ページネーション（将来的に実装） */}
            {articlesResponse.totalCount > articlesResponse.limit && (
              <div className="text-center text-gray-600">
                <p>
                  {articlesResponse.totalCount}件中 {articlesResponse.contents.length}件を表示
                </p>
                {/* TODO: ページネーションコンポーネントの実装 */}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600">記事がありません。</p>
          </div>
        )}
      </div>
    </div>
  )
}