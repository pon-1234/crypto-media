/**
 * 記事フィルタリングコンポーネント
 * @doc DEVELOPMENT_GUIDE.md#UI/UXコンポーネント
 * @issue #28 - 記事一覧ページの機能拡張
 */
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { type Category, type Tag } from '@/lib/schema'

interface ArticleFiltersProps {
  categories: Category[]
  tags: Tag[]
  selectedCategory?: string
  selectedTag?: string
}

/**
 * 記事フィルタリングコンポーネント
 * @param categories カテゴリ一覧
 * @param tags タグ一覧
 * @param selectedCategory 選択中のカテゴリslug
 * @param selectedTag 選択中のタグslug
 */
export function ArticleFilters({
  categories,
  tags,
  selectedCategory,
  selectedTag,
}: ArticleFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  /**
   * フィルタ変更時の処理
   * @param type フィルタタイプ
   * @param value フィルタ値
   */
  const handleFilterChange = (type: 'category' | 'tag', value: string) => {
    const params = new URLSearchParams(searchParams)

    if (value === '') {
      params.delete(type)
    } else {
      params.set(type, value)
    }

    // ページ番号をリセット
    params.delete('page')

    // 現在のパスを維持してクエリパラメータのみ更新
    router.push(`${pathname}?${params.toString()}`)
  }

  /**
   * すべてのフィルタをクリア
   */
  const clearFilters = () => {
    // 現在のパスを維持してクエリパラメータをクリア
    router.push(pathname)
  }

  const hasActiveFilters = selectedCategory || selectedTag

  return (
    <div className="mb-8 space-y-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">絞り込み</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            すべてクリア
          </button>
        )}
      </div>

      {/* カテゴリフィルタ */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          カテゴリ
        </label>
        <select
          id="category"
          value={selectedCategory || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* タグフィルタ */}
      <div>
        <label
          htmlFor="tag"
          className="block text-sm font-medium text-gray-700"
        >
          タグ
        </label>
        <select
          id="tag"
          value={selectedTag || ''}
          onChange={(e) => handleFilterChange('tag', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">すべてのタグ</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      {/* アクティブフィルタの表示 */}
      {hasActiveFilters && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">適用中のフィルタ:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                カテゴリ:{' '}
                {categories.find((c) => c.slug === selectedCategory)?.name}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200"
                  aria-label="カテゴリフィルタを削除"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                タグ: {tags.find((t) => t.slug === selectedTag)?.name}
                <button
                  onClick={() => handleFilterChange('tag', '')}
                  className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-green-600 hover:bg-green-200"
                  aria-label="タグフィルタを削除"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
