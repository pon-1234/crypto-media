/**
 * 有料記事一覧ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/36
 * @issue #36 - メディアサイトの主要な一覧ページ実装
 */
import { Metadata } from 'next'
import {
  getMediaArticlesByMembershipLevel,
  getCategories,
  getTags,
} from '@/lib/microcms'
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
  title: 'プレミアム記事 | Crypto Media',
  description: '有料会員限定の深掘り記事や詳細な分析レポートをお届けします。',
  openGraph: {
    title: 'プレミアム記事 | Crypto Media',
    description: '有料会員限定の深掘り記事や詳細な分析レポートをお届けします。',
    type: 'website',
    url: '/media/premium',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'プレミアム記事 | Crypto Media',
    description: '有料会員限定の深掘り記事や詳細な分析レポートをお届けします。',
  },
}

interface PremiumArticlesPageProps {
  searchParams?: {
    page?: string
    category?: string
    tag?: string
  }
}

/**
 * 有料記事一覧ページコンポーネント
 * @param searchParams URLクエリパラメータ
 * @returns 有料記事一覧ページのJSX要素
 */
export default async function PremiumArticlesPage({
  searchParams,
}: PremiumArticlesPageProps) {
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
    filters.push('membershipLevel[equals]paid') // 有料記事のみ

    if (selectedCategory) {
      // カテゴリでフィルタ
      const categoryData = await getCategories({
        filters: `slug[equals]${selectedCategory}`,
      })
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
      getMediaArticlesByMembershipLevel('paid', {
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
    console.error('Failed to fetch premium articles:', error)
    throw error // Next.jsのエラーバウンダリーに委譲
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-8 sm:mb-12">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
            プレミアム記事
          </h1>
          <p className="max-w-3xl text-base text-gray-600 sm:text-lg">
            有料会員限定の深掘り記事や詳細な分析レポートをお届けします。
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
                    {offset + 1}-
                    {Math.min(
                      offset + articlesResponse.contents.length,
                      articlesResponse.totalCount
                    )}
                    件を表示
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
            <p className="text-gray-600">プレミアム記事がありません。</p>
          </div>
        )}
      </div>
    </div>
  )
}
