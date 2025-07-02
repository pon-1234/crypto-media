/**
 * メディア記事一覧ページ
 * @doc DEVELOPMENT_GUIDE.md#メディア記事一覧
 * @issue #5 - メディア記事一覧・詳細ページの実装
 * @issue #28 - 記事一覧ページの機能拡張
 */
import { Metadata } from 'next'
import { getMediaArticlesList, getCategories, getTags } from '@/lib/microcms'
import { ArticleCard } from '@/components/media/ArticleCard'
import { Pagination } from '@/components/ui/Pagination'
import { ArticleFilters } from '@/components/media/ArticleFilters'

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
  description:
    '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。',
  openGraph: {
    title: '記事一覧 | Crypto Media',
    description:
      '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。',
    type: 'website',
    url: '/media/articles',
  },
  twitter: {
    card: 'summary_large_image',
    title: '記事一覧 | Crypto Media',
    description:
      '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。',
  },
}

interface MediaArticlesPageProps {
  searchParams?: {
    page?: string
    category?: string
    tag?: string
  }
}

/**
 * 記事一覧ページコンポーネント
 * @param searchParams URLクエリパラメータ
 * @returns 記事一覧ページのJSX要素
 */
export default async function MediaArticlesPage({ searchParams }: MediaArticlesPageProps) {
  const currentPage = Number(searchParams?.page) || 1
  const limit = 12 // 1ページあたりの表示件数
  const offset = (currentPage - 1) * limit
  const selectedCategory = searchParams?.category
  const selectedTag = searchParams?.tag

  let articlesResponse
  let categories
  let tags

  try {
    // フィルタ条件を構築
    const filters: string[] = []
    if (selectedCategory) {
      // カテゴリでフィルタ
      const categoryData = await getCategories({ filters: `slug[equals]${selectedCategory}` })
      if (categoryData.contents.length > 0) {
        filters.push(`category[equals]${categoryData.contents[0].id}`)
      }
    }
    if (selectedTag) {
      // タグでフィルタ
      const tagData = await getTags({ filters: `slug[equals]${selectedTag}` })
      if (tagData.contents.length > 0) {
        filters.push(`tags[contains]${tagData.contents[0].id}`)
      }
    }

    // 並行してデータを取得
    const [articlesRes, categoriesRes, tagsRes] = await Promise.all([
      getMediaArticlesList({
        limit,
        offset,
        orders: '-publishedAt',
        filters: filters.length > 0 ? filters.join('[and]') : undefined,
      }),
      getCategories({ limit: 100 }),
      getTags({ limit: 100 }),
    ])

    articlesResponse = articlesRes
    categories = categoriesRes.contents
    tags = tagsRes.contents
  } catch (error) {
    console.error('Failed to fetch data:', error)
    throw error // Next.jsのエラーバウンダリーに委議
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-8 sm:mb-12">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
            記事一覧
          </h1>
          <p className="max-w-3xl text-base text-gray-600 sm:text-lg">
            暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。
          </p>
        </div>

        {/* フィルタリング */}
        <div className="mb-8 lg:mb-12">
          <ArticleFilters
            categories={categories}
            tags={tags}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
          />
        </div>

        {/* 記事一覧 */}
        {articlesResponse.contents.length > 0 ? (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articlesResponse.contents.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* ページネーション */}
            {articlesResponse.totalCount > limit && (
              <div className="mt-8">
                <div className="mb-4 text-center">
                  <p className="text-sm text-gray-600 sm:text-base">
                    全{articlesResponse.totalCount}件中 
                    {offset + 1}-{Math.min(offset + articlesResponse.contents.length, articlesResponse.totalCount)}件を表示
                  </p>
                </div>
                <Pagination 
                  currentPage={currentPage}
                  totalPages={Math.ceil(articlesResponse.totalCount / limit)}
                  className="mt-8"
                />
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center sm:py-24">
            <p className="text-gray-600">記事がありません。</p>
          </div>
        )}
      </div>
    </div>
  )
}
