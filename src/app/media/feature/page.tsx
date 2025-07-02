/**
 * 特集一覧ページ
 * @doc DEVELOPMENT_GUIDE.md#URL構造と主要ページ一覧
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getFeatures } from '@/lib/microcms'

export const metadata: Metadata = {
  title: '特集一覧 | 暗号資産総合メディア',
  description: '暗号資産・ブロックチェーンに関する特集記事をまとめています。',
}

/**
 * 特集一覧ページコンポーネント
 * @returns 特集一覧表示
 */
export default async function FeatureIndexPage() {
  const { contents: features } = await getFeatures({
    fields: ['id', 'name', 'slug', 'description', 'heroImage'],
    limit: 100,
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">特集一覧</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.id}
              href={`/media/feature/${feature.slug}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {feature.heroImage && (
                <div className="aspect-w-16 aspect-h-9 relative h-48">
                  <Image
                    src={feature.heroImage.url}
                    alt={feature.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h2>
                <p className="text-gray-600 line-clamp-3">
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
        
        {features.length === 0 && (
          <p className="text-center text-gray-600 py-12">
            特集が登録されていません。
          </p>
        )}
      </div>
    </main>
  )
}