/**
 * ArticleFiltersコンポーネントのテスト
 * @issue #28 - 記事一覧ページの機能拡張
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, useSearchParams, usePathname, type ReadonlyURLSearchParams } from 'next/navigation'
import { ArticleFilters } from '../ArticleFilters'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Category, Tag } from '@/lib/schema'

// next/navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}))

// ReadonlyURLSearchParamsのモック型
const createMockSearchParams = (init?: string | URLSearchParams | Record<string, string>) => {
  const params = new URLSearchParams(init)
  return params as unknown as ReadonlyURLSearchParams
}

describe('ArticleFilters', () => {
  const mockPush = vi.fn()
  const mockCategories: Category[] = [
    { id: '1', name: 'ニュース', slug: 'news', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', name: '技術', slug: 'tech', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ]
  const mockTags: Tag[] = [
    { id: '1', name: 'Bitcoin', slug: 'bitcoin', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', name: 'Ethereum', slug: 'ethereum', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>)
    vi.mocked(useSearchParams).mockReturnValue(createMockSearchParams())
    vi.mocked(usePathname).mockReturnValue('/media/articles')
  })

  it('フィルタオプションが正しく表示される', () => {
    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
      />
    )

    // カテゴリフィルタ
    expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument()
    expect(screen.getByText('すべてのカテゴリ')).toBeInTheDocument()
    expect(screen.getByText('ニュース')).toBeInTheDocument()
    expect(screen.getByText('技術')).toBeInTheDocument()

    // タグフィルタ
    expect(screen.getByLabelText('タグ')).toBeInTheDocument()
    expect(screen.getByText('すべてのタグ')).toBeInTheDocument()
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
  })

  it('カテゴリフィルタの変更が正しく処理される', () => {
    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
      />
    )

    const categorySelect = screen.getByLabelText('カテゴリ')
    fireEvent.change(categorySelect, { target: { value: 'tech' } })

    expect(mockPush).toHaveBeenCalledWith('/media/articles?category=tech')
  })

  it('タグフィルタの変更が正しく処理される', () => {
    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
      />
    )

    const tagSelect = screen.getByLabelText('タグ')
    fireEvent.change(tagSelect, { target: { value: 'bitcoin' } })

    expect(mockPush).toHaveBeenCalledWith('/media/articles?tag=bitcoin')
  })

  it('既存のクエリパラメータが保持される', () => {
    vi.mocked(useSearchParams).mockReturnValue(createMockSearchParams('sort=newest&page=2'))

    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
      />
    )

    const categorySelect = screen.getByLabelText('カテゴリ')
    fireEvent.change(categorySelect, { target: { value: 'news' } })

    // pageパラメータは削除され、sortは保持される
    expect(mockPush).toHaveBeenCalledWith('/media/articles?sort=newest&category=news')
  })

  it('選択中のフィルタが正しく表示される', () => {
    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
        selectedCategory="tech"
        selectedTag="ethereum"
      />
    )

    // 選択中のフィルタがselectに反映される
    const categorySelect = screen.getByLabelText('カテゴリ') as HTMLSelectElement
    expect(categorySelect.value).toBe('tech')

    const tagSelect = screen.getByLabelText('タグ') as HTMLSelectElement
    expect(tagSelect.value).toBe('ethereum')

    // アクティブフィルタの表示
    expect(screen.getByText('適用中のフィルタ:')).toBeInTheDocument()
    expect(screen.getByText('カテゴリ: 技術')).toBeInTheDocument()
    expect(screen.getByText('タグ: Ethereum')).toBeInTheDocument()

    // クリアボタンの表示
    expect(screen.getByText('すべてクリア')).toBeInTheDocument()
  })

  it('個別のフィルタクリアが機能する', () => {
    // 既存のクエリパラメータとして両方のフィルタを設定
    vi.mocked(useSearchParams).mockReturnValue(createMockSearchParams('category=tech&tag=ethereum'))

    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
        selectedCategory="tech"
        selectedTag="ethereum"
      />
    )

    // カテゴリフィルタのクリア
    const categoryRemoveButton = screen.getByLabelText('カテゴリフィルタを削除')
    fireEvent.click(categoryRemoveButton)

    expect(mockPush).toHaveBeenCalledWith('/media/articles?tag=ethereum')
  })

  it('すべてクリアボタンが機能する', () => {
    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
        selectedCategory="tech"
        selectedTag="ethereum"
      />
    )

    const clearAllButton = screen.getByText('すべてクリア')
    fireEvent.click(clearAllButton)

    expect(mockPush).toHaveBeenCalledWith('/media/articles')
  })

  it('フィルタが空の値に変更されると削除される', () => {
    vi.mocked(useSearchParams).mockReturnValue(createMockSearchParams('category=tech'))

    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
        selectedCategory="tech"
      />
    )

    const categorySelect = screen.getByLabelText('カテゴリ')
    fireEvent.change(categorySelect, { target: { value: '' } })

    expect(mockPush).toHaveBeenCalledWith('/media/articles?')
  })

  it('フィルタがない場合、クリアボタンは表示されない', () => {
    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
      />
    )

    expect(screen.queryByText('すべてクリア')).not.toBeInTheDocument()
    expect(screen.queryByText('適用中のフィルタ:')).not.toBeInTheDocument()
  })

  it('存在しないフィルタが選択されてもエラーにならない', () => {
    render(
      <ArticleFilters
        categories={mockCategories}
        tags={mockTags}
        selectedCategory="invalid-category"
        selectedTag="invalid-tag"
      />
    )

    expect(screen.getByText('適用中のフィルタ:')).toBeInTheDocument()
    // カテゴリ名が表示されないことを確認
    expect(screen.queryByText('カテゴリ: ')).toBeNull()
    // タグ名が表示されないことを確認
    expect(screen.queryByText('タグ: ')).toBeNull()
  })
})