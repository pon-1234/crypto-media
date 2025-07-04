import { Metadata } from 'next'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SearchResultGrid } from '@/components/media/SearchResultGrid'
import { Pagination } from '@/components/ui/Pagination'
import { SearchForm } from '@/components/ui/SearchForm'
import { searchMediaArticles } from '@/lib/microcms'

interface SearchPageProps {
  searchParams?: {
    q?: string
    page?: string
  }
}

/**
 * Generate dynamic metadata for search pages
 *
 * @doc Creates SEO-optimized metadata for search results
 * @issue #29 - サイト内検索機能の実装
 * @param props - Page props containing search query
 * @returns Metadata object
 */
export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const query = searchParams?.q || ''

  return {
    title: query
      ? `「${query}」の検索結果 | Crypto Media`
      : '検索 | Crypto Media',
    description: query
      ? `「${query}」に関する記事の検索結果です。`
      : '暗号資産・ブロックチェーンに関する記事を検索できます。',
    robots: 'noindex, follow', // 検索結果ページはインデックスしない
  }
}

/**
 * Search results page
 *
 * @doc Displays search results with pagination
 * @issue #29 - サイト内検索機能の実装
 * @param props - Page props containing search query and page number
 * @returns Search page component
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q || ''
  const currentPage = Number(searchParams?.page) || 1
  const limit = 12 // 1ページあたりの表示件数
  const offset = (currentPage - 1) * limit

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { label: 'HOME', href: '/' },
    { label: 'MEDIA', href: '/media' },
    { label: '検索結果' },
  ]

  // 検索クエリがない場合は検索フォームのみ表示
  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-8 text-3xl font-bold">記事を検索</h1>
          <SearchForm
            className="mx-auto max-w-lg"
            placeholder="キーワードを入力してください"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            記事のタイトル、本文、タグなどから検索できます。
          </p>
        </div>
      </div>
    )
  }

  // Fetch search results
  let articles = null
  let totalCount = 0
  let error = null

  try {
    const response = await searchMediaArticles(query, { limit, offset })
    articles = response.contents
    totalCount = response.totalCount
  } catch (e) {
    error = '検索中にエラーが発生しました。'
    console.error('Search error:', e)
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <header className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">「{query}」の検索結果</h1>
        <div className="mb-4">
          <SearchForm className="max-w-lg" />
        </div>
        {error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {totalCount}件の記事が見つかりました
          </p>
        )}
      </header>

      {error || !articles ? (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            検索結果を表示できませんでした。
          </p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
            「{query}」に一致する記事が見つかりませんでした。
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            別のキーワードで検索してみてください。
          </p>
        </div>
      ) : (
        <>
          <SearchResultGrid articles={articles} query={query} />

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/media/search?q=${encodeURIComponent(query)}`}
                className="mt-8"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
