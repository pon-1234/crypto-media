/**
 * カテゴリ一覧ページのテスト
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryIndexPage from '../page'

// microCMSクライアントのモック
vi.mock('@/lib/microcms', () => ({
  getCategories: vi.fn(),
}))

describe('CategoryIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('カテゴリ一覧を表示する', async () => {
    const { getCategories } = await import('@/lib/microcms')
    vi.mocked(getCategories).mockResolvedValue({
      contents: [
        {
          id: '1',
          name: 'ビットコイン',
          slug: 'bitcoin',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'イーサリアム',
          slug: 'ethereum',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      totalCount: 2,
      offset: 0,
      limit: 100,
    })

    const Component = await CategoryIndexPage()
    render(Component)

    expect(screen.getByText('カテゴリ一覧')).toBeInTheDocument()
    expect(screen.getByText('ビットコイン')).toBeInTheDocument()
    expect(screen.getByText('イーサリアム')).toBeInTheDocument()

    // リンクの検証
    const bitcoinLink = screen.getByRole('link', { name: 'ビットコイン' })
    expect(bitcoinLink).toHaveAttribute('href', '/media/category/bitcoin')

    const ethereumLink = screen.getByRole('link', { name: 'イーサリアム' })
    expect(ethereumLink).toHaveAttribute('href', '/media/category/ethereum')
  })

  it('カテゴリが存在しない場合の表示', async () => {
    const { getCategories } = await import('@/lib/microcms')
    vi.mocked(getCategories).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    const Component = await CategoryIndexPage()
    render(Component)

    expect(screen.getByText('カテゴリ一覧')).toBeInTheDocument()
    expect(
      screen.getByText('カテゴリが登録されていません。')
    ).toBeInTheDocument()
  })

  it('正しいAPIパラメータでカテゴリを取得する', async () => {
    const { getCategories } = await import('@/lib/microcms')
    vi.mocked(getCategories).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    await CategoryIndexPage()

    expect(getCategories).toHaveBeenCalledWith({
      fields: ['id', 'name', 'slug'],
      limit: 100,
    })
  })
})