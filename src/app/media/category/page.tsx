/**
 * カテゴリ一覧ページ
 * @doc DEVELOPMENT_GUIDE.md#URL構造と主要ページ一覧
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type Metadata } from 'next'
import Link from 'next/link'
import { getCategories } from '@/lib/microcms'

export const metadata: Metadata = {
  title: 'カテゴリ一覧 | 暗号資産総合メディア',
  description: '暗号資産・ブロックチェーンに関する記事をカテゴリ別に分類しています。',
}

/**
 * カテゴリ一覧ページコンポーネント
 * @returns カテゴリ一覧表示
 */
export default async function CategoryIndexPage() {
  const { contents: categories } = await getCategories({
    fields: ['id', 'name', 'slug'],
    limit: 100,
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">カテゴリ一覧</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/media/category/${category.slug}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {category.name}
              </h2>
            </Link>
          ))}
        </div>
        
        {categories.length === 0 && (
          <p className="text-center text-gray-600 py-12">
            カテゴリが登録されていません。
          </p>
        )}
      </div>
    </main>
  )
}