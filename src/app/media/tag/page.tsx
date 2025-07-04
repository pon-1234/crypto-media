/**
 * タグ一覧ページ
 * @doc DEVELOPMENT_GUIDE.md#URL構造と主要ページ一覧
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type Metadata } from 'next'
import Link from 'next/link'
import { getTags } from '@/lib/microcms'

export const metadata: Metadata = {
  title: 'タグ一覧 | 暗号資産総合メディア',
  description:
    '暗号資産・ブロックチェーンに関する記事をタグ別に探すことができます。',
}

/**
 * タグ一覧ページコンポーネント
 * タグクラウド形式で表示
 * @returns タグ一覧表示
 */
export default async function TagIndexPage() {
  const { contents: tags } = await getTags({
    fields: ['id', 'name', 'slug'],
    limit: 100,
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">タグ一覧</h1>

        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/media/tag/${tag.slug}`}
              className="inline-block rounded-full bg-gray-100 px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-200"
            >
              <span className="text-sm font-medium">{tag.name}</span>
            </Link>
          ))}
        </div>

        {tags.length === 0 && (
          <p className="py-12 text-center text-gray-600">
            タグが登録されていません。
          </p>
        )}
      </div>
    </main>
  )
}
