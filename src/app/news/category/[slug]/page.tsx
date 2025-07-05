import { type Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { generatePageMetadata } from '@/lib/metadata/generateMetadata'
import { getCorporateNewsListByCategory } from '@/lib/microcms/corporate-news'
import {
  getCorporateNewsCategoryBySlug,
  getAllCorporateNewsCategorySlugs,
} from '@/lib/microcms/corporate-news-categories'
const ITEMS_PER_PAGE = 10

/**
 * ニュースカテゴリ別一覧ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/35
 * @issue #35 - コーポレートサイトの未実装ページ作成
 */
type Props = {
  params: { slug: string }
  searchParams: { page?: string }
}

/**
 * 静的パラメータの生成
 * @doc 全カテゴリのスラッグを事前生成
 */
export async function generateStaticParams() {
  const slugs = await getAllCorporateNewsCategorySlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function NewsCategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug } = params
  const { page = '1' } = searchParams

  const currentPage = parseInt(page, 10)
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // カテゴリ情報の取得と存在確認
  const category = await getCorporateNewsCategoryBySlug(slug)
  if (!category) {
    notFound()
  }

  try {
    const { contents, totalCount } = await getCorporateNewsListByCategory(
      slug,
      {
        limit: ITEMS_PER_PAGE,
        offset,
      }
    )

    if (contents.length === 0 && currentPage === 1) {
      notFound()
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const categoryName = category.name

    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold">
            {categoryName}のニュース一覧
          </h1>

          {contents.length === 0 ? (
            <p className="text-gray-500">
              このカテゴリーのニュースはまだありません。
            </p>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {contents.map((news) => (
                  <li key={news.id} className="py-4">
                    <Link
                      href={`/news/${news.id}`}
                      className="group block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4">
                        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                          {news.title}
                        </h2>
                        <time
                          dateTime={news.publishedAt}
                          className="mt-2 block text-sm text-gray-500"
                        >
                          {new Date(
                            news.publishedAt || news.createdAt
                          ).toLocaleDateString('ja-JP')}
                        </time>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center space-x-2">
                  {currentPage > 1 && (
                    <Link
                      href={`/news/category/${slug}?page=${currentPage - 1}`}
                      className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      前へ
                    </Link>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <Link
                        key={pageNum}
                        href={`/news/category/${slug}?page=${pageNum}`}
                        className={`rounded px-3 py-2 text-sm ${
                          pageNum === currentPage
                            ? 'bg-blue-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  )}

                  {currentPage < totalPages && (
                    <Link
                      href={`/news/category/${slug}?page=${currentPage + 1}`}
                      className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      次へ
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    )
  } catch (error) {
    console.error('Failed to fetch news by category:', error)
    notFound()
  }
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params
  const category = await getCorporateNewsCategoryBySlug(slug)
  const categoryName = category?.name || slug

  return generatePageMetadata({
    title: `${categoryName}のニュース一覧`,
    description: `${categoryName}に関する最新のニュースをご覧いただけます。`,
    path: `/news/category/${slug}`,
  })
}

/**
 * Revalidate every hour (ISR)
 */
export const revalidate = 3600
