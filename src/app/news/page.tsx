import { Metadata } from 'next'
import Link from 'next/link'
import { getCorporateNewsList } from '@/lib/microcms'
import { formatDate } from '@/lib/utils/date'
import { Pagination } from '@/components/ui/Pagination'

/**
 * コーポレートお知らせ一覧ページ
 *
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

export const metadata: Metadata = {
  title: 'お知らせ | 株式会社Example',
  description: '株式会社Exampleからの最新のお知らせをご覧いただけます。',
}

const ITEMS_PER_PAGE = 10

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function NewsListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const { contents, totalCount } = await getCorporateNewsList({
    limit: ITEMS_PER_PAGE,
    offset,
    orders: '-publishedAt',
  })

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">お知らせ</h1>

      {contents.length === 0 ? (
        <p className="text-gray-600">お知らせはありません。</p>
      ) : (
        <>
          <ul className="space-y-6">
            {contents.map((news) => (
              <li key={news.id} className="border-b pb-6">
                <Link
                  href={`/news/${news.id}`}
                  className="group -mx-4 block rounded px-4 py-2 transition-colors hover:bg-gray-50"
                >
                  <time className="text-sm text-gray-600">
                    {formatDate(news.publishedAt || news.createdAt)}
                  </time>
                  <h2 className="mt-2 text-xl font-semibold transition-colors group-hover:text-blue-600">
                    {news.title}
                  </h2>
                </Link>
              </li>
            ))}
          </ul>

          {/* ページネーション */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/news"
          />
        </>
      )}
    </div>
  )
}
