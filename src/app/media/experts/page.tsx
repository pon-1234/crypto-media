/**
 * 執筆者・監修者一覧ページ
 * @doc DEVELOPMENT_GUIDE.md#URL構造と主要ページ一覧
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getExperts, stripHtmlTags } from '@/lib/microcms'

export const metadata: Metadata = {
  title: '執筆者・監修者一覧 | 暗号資産総合メディア',
  description:
    '暗号資産・ブロックチェーン分野の専門家による記事をお届けしています。',
}

/**
 * 執筆者・監修者一覧ページコンポーネント
 * @returns 執筆者・監修者一覧表示
 */
export default async function ExpertsIndexPage() {
  const { contents: experts } = await getExperts({
    fields: ['id', 'name', 'slug', 'role', 'profile', 'avatar'],
    limit: 100,
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">執筆者・監修者一覧</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <Link
              key={expert.id}
              href={`/media/experts/${expert.slug}`}
              className="block overflow-hidden rounded-lg bg-white shadow transition-shadow duration-200 hover:shadow-md"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {expert.avatar && (
                    <div className="flex-shrink-0">
                      <Image
                        src={expert.avatar.url}
                        alt={expert.name}
                        width={80}
                        height={80}
                        className="rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="mb-1 text-xl font-semibold text-gray-900">
                      {expert.name}
                    </h2>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {expert.role.map((role) => (
                        <span
                          key={role}
                          className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="line-clamp-3 text-sm text-gray-600">
                      {stripHtmlTags(expert.profile)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {experts.length === 0 && (
          <p className="py-12 text-center text-gray-600">
            執筆者・監修者が登録されていません。
          </p>
        )}
      </div>
    </main>
  )
}
