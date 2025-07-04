/**
 * 特集一覧ページのテスト
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeatureIndexPage from '../page'

// microCMSクライアントのモック
vi.mock('@/lib/microcms', () => ({
  getFeatures: vi.fn(),
}))

// next/imageのモック
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, fill, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      {...props}
      style={
        fill
          ? {
              objectFit: props.className?.includes('object-cover')
                ? 'cover'
                : 'fill',
            }
          : {}
      }
    />
  )),
}))

describe('FeatureIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('特集一覧を表示する', async () => {
    const { getFeatures } = await import('@/lib/microcms')
    vi.mocked(getFeatures).mockResolvedValue({
      contents: [
        {
          id: '1',
          name: '2025年の暗号資産トレンド',
          slug: '2025-crypto-trends',
          description:
            '2025年に注目すべき暗号資産のトレンドを専門家が解説。DeFi、NFT、Web3の最新動向を網羅。',
          heroImage: {
            url: 'https://example.com/feature1.jpg',
            width: 1200,
            height: 675,
          },
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'ビットコイン完全ガイド',
          slug: 'bitcoin-complete-guide',
          description:
            'ビットコインの基礎から応用まで、初心者にもわかりやすく解説する完全ガイド。',
          heroImage: {
            url: 'https://example.com/feature2.jpg',
            width: 1200,
            height: 675,
          },
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

    const Component = await FeatureIndexPage()
    render(Component)

    expect(screen.getByText('特集一覧')).toBeInTheDocument()
    expect(screen.getByText('2025年の暗号資産トレンド')).toBeInTheDocument()
    expect(screen.getByText('ビットコイン完全ガイド')).toBeInTheDocument()

    // 説明文の検証
    expect(
      screen.getByText(/2025年に注目すべき暗号資産のトレンド/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/ビットコインの基礎から応用まで/)
    ).toBeInTheDocument()

    // リンクの検証
    const trendLink = screen.getByRole('link', {
      name: /2025年の暗号資産トレンド/,
    })
    expect(trendLink).toHaveAttribute(
      'href',
      '/media/feature/2025-crypto-trends'
    )

    const bitcoinLink = screen.getByRole('link', {
      name: /ビットコイン完全ガイド/,
    })
    expect(bitcoinLink).toHaveAttribute(
      'href',
      '/media/feature/bitcoin-complete-guide'
    )

    // ヒーロー画像の検証
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('src', 'https://example.com/feature1.jpg')
    expect(images[0]).toHaveAttribute('alt', '2025年の暗号資産トレンド')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/feature2.jpg')
    expect(images[1]).toHaveAttribute('alt', 'ビットコイン完全ガイド')
  })

  it('ヒーロー画像がない特集も正しく表示する', async () => {
    const { getFeatures } = await import('@/lib/microcms')
    vi.mocked(getFeatures).mockResolvedValue({
      contents: [
        {
          id: '1',
          name: 'DeFi入門',
          slug: 'defi-introduction',
          description: 'DeFiの基本を学ぶ',
          heroImage: undefined,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      totalCount: 1,
      offset: 0,
      limit: 100,
    })

    const Component = await FeatureIndexPage()
    render(Component)

    expect(screen.getByText('DeFi入門')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('特集が存在しない場合の表示', async () => {
    const { getFeatures } = await import('@/lib/microcms')
    vi.mocked(getFeatures).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    const Component = await FeatureIndexPage()
    render(Component)

    expect(screen.getByText('特集一覧')).toBeInTheDocument()
    expect(screen.getByText('特集が登録されていません。')).toBeInTheDocument()
  })

  it('正しいAPIパラメータで特集を取得する', async () => {
    const { getFeatures } = await import('@/lib/microcms')
    vi.mocked(getFeatures).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    await FeatureIndexPage()

    expect(getFeatures).toHaveBeenCalledWith({
      fields: ['id', 'name', 'slug', 'description', 'heroImage'],
      limit: 100,
    })
  })
})
