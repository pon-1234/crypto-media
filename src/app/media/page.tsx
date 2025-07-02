import { getMediaArticlesList } from '@/lib/microcms/media-articles'
import { ArticleGrid } from '@/components/media/ArticleGrid'

/**
 * メディアサイトのトップページ
 * @issue #1 - 初期セットアップ
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
export default async function MediaHomePage() {
  const { contents: articles } = await getMediaArticlesList()

  return (
    <main className="container mx-auto min-h-screen p-4 md:p-8">
      <h1 className="mb-8 text-3xl font-bold">新着記事一覧</h1>
      <ArticleGrid articles={articles} />
    </main>
  )
}
