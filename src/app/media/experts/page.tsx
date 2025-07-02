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
  description: '暗号資産・ブロックチェーン分野の専門家による記事をお届けしています。',
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">執筆者・監修者一覧</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map((expert) => (
            <Link
              key={expert.id}
              href={`/media/experts/${expert.slug}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden"
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {expert.name}
                    </h2>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {expert.role.map((role) => (
                        <span
                          key={role}
                          className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {stripHtmlTags(expert.profile)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {experts.length === 0 && (
          <p className="text-center text-gray-600 py-12">
            執筆者・監修者が登録されていません。
          </p>
        )}
      </div>
    </main>
  )
}