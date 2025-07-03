/**
 * 特集詳細ページのテスト
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import FeatureDetailPage, { generateStaticParams, generateMetadata } from '../page'
import { getAllFeatureSlugs } from '@/lib/microcms'

// モックの設定
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/lib/microcms', () => ({
  getFeatureBySlug: vi.fn(),
  getAllFeatureSlugs: vi.fn(),
  getMediaArticlesByFeature: vi.fn(),
}))

vi.mock('@/components/media/ArticleCard', () => ({
  ArticleCard: vi.fn(({ article }) => (
    <div data-testid="article-card">{article.title}</div>
  )),
}))

// Next.js ImageコンポーネントのPropsの型定義
type ImageProps = {
  src: string
  alt: string
  [key: string]: unknown
}

vi.mock('next/image', () => ({
  default: vi.fn((props: ImageProps) => {
    const { src, alt, ...rest } = props
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} {...rest} />
    )
  }),
}))

const mockSlugs = ['2025-crypto-trends', 'defi-introduction']
vi.mocked(getAllFeatureSlugs).mockResolvedValue(mockSlugs)

describe('FeatureDetailPage', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    // CI環境の判定をバイパスし、APIキーをダミー設定
    process.env.CI = 'false'
    process.env.MICROCMS_API_KEY = 'test-key'
  })

  afterEach(() => {
    // 環境変数を元に戻す
    process.env = originalEnv
  })

  it('特集の詳細と関連記事を表示する', async () => {
    const mockFeature = {
      id: '1',
      name: '2025年の暗号資産トレンド',
      slug: '2025-crypto-trends',
      description: '2025年に注目すべき暗号資産のトレンドを専門家が解説。\nDeFi、NFT、Web3の最新動向を網羅。',
      heroImage: {
        url: 'https://example.com/hero.jpg',
        width: 1200,
        height: 675,
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const mockArticles = {
      contents: [
        {
          id: '1',
          title: 'DeFiの未来予測',
          slug: 'defi-future',
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '記事内容',
          heroImage: { url: 'https://example.com/image1.jpg', width: 800, height: 600 },
          features: [mockFeature],
          publishedAt: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          title: 'NFTマーケットの動向',
          slug: 'nft-market',
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '記事内容',
          heroImage: { url: 'https://example.com/image2.jpg', width: 800, height: 600 },
          features: [mockFeature],
          publishedAt: '2023-01-02T00:00:00.000Z',
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z',
          revisedAt: '2023-01-02T00:00:00.000Z',
        },
        {
          id: '3',
          title: 'Web3技術の進化',
          slug: 'web3-evolution',
          type: 'article' as const,
          membershipLevel: 'paid' as const,
          content: '記事内容',
          heroImage: { url: 'https://example.com/image3.jpg', width: 800, height: 600 },
          features: [mockFeature],
          publishedAt: '2023-01-03T00:00:00.000Z',
          createdAt: '2023-01-03T00:00:00.000Z',
          updatedAt: '2023-01-03T00:00:00.000Z',
          revisedAt: '2023-01-03T00:00:00.000Z',
        },
      ],
      totalCount: 3,
      offset: 0,
      limit: 50,
    }

    const { getFeatureBySlug, getMediaArticlesByFeature } = await import('@/lib/microcms')
    vi.mocked(getFeatureBySlug).mockResolvedValue(mockFeature)
    vi.mocked(getMediaArticlesByFeature).mockResolvedValue(mockArticles)

    const Component = await FeatureDetailPage({ params: { slug: '2025-crypto-trends' } })
    render(Component)

    // 特集情報の検証
    expect(screen.getByText('2025年の暗号資産トレンド')).toBeInTheDocument()
    expect(screen.getByText(/2025年に注目すべき暗号資産のトレンドを専門家が解説/)).toBeInTheDocument()
    expect(screen.getByText(/DeFi、NFT、Web3の最新動向を網羅/)).toBeInTheDocument()

    // ヒーロー画像の検証
    const heroImage = screen.getByRole('img', { name: '2025年の暗号資産トレンド' })
    expect(heroImage).toHaveAttribute('src', 'https://example.com/hero.jpg')

    // 記事一覧の検証
    expect(screen.getByText('関連記事')).toBeInTheDocument()
    expect(screen.getByText('（3件）')).toBeInTheDocument()
    expect(screen.getAllByTestId('article-card')).toHaveLength(3)
    expect(screen.getByText('DeFiの未来予測')).toBeInTheDocument()
    expect(screen.getByText('NFTマーケットの動向')).toBeInTheDocument()
    expect(screen.getByText('Web3技術の進化')).toBeInTheDocument()
  })

  it('ヒーロー画像がない特集も正しく表示する', async () => {
    const mockFeature = {
      id: '1',
      name: 'DeFi入門',
      slug: 'defi-introduction',
      description: 'DeFiの基本を学ぶ',
      heroImage: undefined,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const { getFeatureBySlug, getMediaArticlesByFeature } = await import('@/lib/microcms')
    vi.mocked(getFeatureBySlug).mockResolvedValue(mockFeature)
    vi.mocked(getMediaArticlesByFeature).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 50,
    })

    const Component = await FeatureDetailPage({ params: { slug: 'defi-introduction' } })
    render(Component)

    expect(screen.getByText('DeFi入門')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('関連記事がない場合の表示', async () => {
    const mockFeature = {
      id: '1',
      name: '新特集',
      slug: 'new-feature',
      description: '新しい特集です',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const { getFeatureBySlug, getMediaArticlesByFeature } = await import('@/lib/microcms')
    vi.mocked(getFeatureBySlug).mockResolvedValue(mockFeature)
    vi.mocked(getMediaArticlesByFeature).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 50,
    })

    const Component = await FeatureDetailPage({ params: { slug: 'new-feature' } })
    render(Component)

    expect(screen.getByText('関連記事')).toBeInTheDocument()
    expect(screen.queryByText(/（\d+件）/)).not.toBeInTheDocument()
    expect(
      screen.getByText('この特集に関連する記事はまだありません。')
    ).toBeInTheDocument()
  })

  it('存在しないスラッグの場合は404を返す', async () => {
    const { getFeatureBySlug } = await import('@/lib/microcms')
    vi.mocked(getFeatureBySlug).mockRejectedValue(new Error('Not found'))

    await FeatureDetailPage({ params: { slug: 'not-found' } })

    expect(notFound).toHaveBeenCalled()
  })

  it('正しいAPIパラメータで記事を取得する', async () => {
    const mockFeature = {
      id: 'feature-123',
      name: 'テスト特集',
      slug: 'test-feature',
      description: 'テスト',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const { getFeatureBySlug, getMediaArticlesByFeature } = await import('@/lib/microcms')
    vi.mocked(getFeatureBySlug).mockResolvedValue(mockFeature)
    vi.mocked(getMediaArticlesByFeature).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 50,
    })

    await FeatureDetailPage({ params: { slug: 'test-feature' } })

    expect(getMediaArticlesByFeature).toHaveBeenCalledWith('feature-123', {
      limit: 50,
      orders: '-publishedAt',
    })
  })

  it('generateStaticParamsが正しく動作する', async () => {
    const result = await generateStaticParams()

    expect(result).toEqual([
      { slug: '2025-crypto-trends' },
      { slug: 'defi-introduction' },
    ])
  })

  it('generateMetadataが正しくメタデータを生成する', async () => {
    const mockFeature = {
      id: '1',
      name: '2025年の暗号資産トレンド',
      slug: '2025-crypto-trends',
      description: '2025年に注目すべき暗号資産のトレンドを専門家が解説',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const { getFeatureBySlug } = await import('@/lib/microcms')
    vi.mocked(getFeatureBySlug).mockResolvedValue(mockFeature)

    const metadata = await generateMetadata({ params: { slug: '2025-crypto-trends' } })

    expect(metadata).toEqual({
      title: '2025年の暗号資産トレンド | 特集 | 暗号資産総合メディア',
      description: '2025年に注目すべき暗号資産のトレンドを専門家が解説',
    })
  })

  it('generateMetadataがエラー時にデフォルトメタデータを返す', async () => {
    const { getFeatureBySlug } = await import('@/lib/microcms')
    vi.mocked(getFeatureBySlug).mockRejectedValue(new Error('Not found'))

    const metadata = await generateMetadata({ params: { slug: 'not-found' } })

    expect(metadata).toEqual({
      title: '特集 | 暗号資産総合メディア',
    })
  })
})