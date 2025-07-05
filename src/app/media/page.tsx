import { getMediaArticlesList } from '@/lib/microcms/media-articles'
import { ArticleGrid } from '@/components/media/ArticleGrid'

/**
 * メディアサイトのトップページ
 * @issue #1 - 初期セットアップ
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
export default async function MediaHomePage() {
  try {
    const { contents: articles } = await getMediaArticlesList()

    return (
      <main className="container mx-auto min-h-screen p-4 md:p-8">
        <h1 className="mb-8 text-3xl font-bold">新着記事一覧</h1>
        <ArticleGrid articles={articles} />
      </main>
    )
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    
    // microCMSのエラーの場合、空の記事リストを表示
    return (
      <main className="container mx-auto min-h-screen p-4 md:p-8">
        <h1 className="mb-8 text-3xl font-bold">新着記事一覧</h1>
        <div className="text-center py-8">
          <p className="text-gray-500">記事の取得に失敗しました。</p>
          <p className="text-sm text-gray-400 mt-2">
            {process.env.NODE_ENV === 'development' && 
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}`}
          </p>
        </div>
      </main>
    )
  }
}
