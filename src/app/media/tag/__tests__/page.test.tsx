/**
 * タグ一覧ページのテスト
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TagIndexPage from '../page'

// microCMSクライアントのモック
vi.mock('@/lib/microcms', () => ({
  getTags: vi.fn(),
}))

describe('TagIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('タグ一覧をタグクラウド形式で表示する', async () => {
    const { getTags } = await import('@/lib/microcms')
    vi.mocked(getTags).mockResolvedValue({
      contents: [
        {
          id: '1',
          name: 'DeFi',
          slug: 'defi',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'NFT',
          slug: 'nft',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '3',
          name: 'Web3',
          slug: 'web3',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      totalCount: 3,
      offset: 0,
      limit: 100,
    })

    const Component = await TagIndexPage()
    render(Component)

    expect(screen.getByText('タグ一覧')).toBeInTheDocument()
    expect(screen.getByText('DeFi')).toBeInTheDocument()
    expect(screen.getByText('NFT')).toBeInTheDocument()
    expect(screen.getByText('Web3')).toBeInTheDocument()

    // リンクの検証
    const defiLink = screen.getByRole('link', { name: 'DeFi' })
    expect(defiLink).toHaveAttribute('href', '/media/tag/defi')

    const nftLink = screen.getByRole('link', { name: 'NFT' })
    expect(nftLink).toHaveAttribute('href', '/media/tag/nft')

    const web3Link = screen.getByRole('link', { name: 'Web3' })
    expect(web3Link).toHaveAttribute('href', '/media/tag/web3')
  })

  it('タグが存在しない場合の表示', async () => {
    const { getTags } = await import('@/lib/microcms')
    vi.mocked(getTags).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    const Component = await TagIndexPage()
    render(Component)

    expect(screen.getByText('タグ一覧')).toBeInTheDocument()
    expect(
      screen.getByText('タグが登録されていません。')
    ).toBeInTheDocument()
  })

  it('正しいAPIパラメータでタグを取得する', async () => {
    const { getTags } = await import('@/lib/microcms')
    vi.mocked(getTags).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    await TagIndexPage()

    expect(getTags).toHaveBeenCalledWith({
      fields: ['id', 'name', 'slug'],
      limit: 100,
    })
  })
})