/**
 * 執筆者・監修者詳細ページのテスト
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import ExpertDetailPage, { generateStaticParams, generateMetadata } from '../page'
import { getAllExpertSlugs } from '@/lib/microcms'

// モックの設定
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/lib/microcms', () => ({
  getExpertBySlug: vi.fn(),
  getAllExpertSlugs: vi.fn(),
  getMediaArticlesByAuthor: vi.fn(),
  getMediaArticlesBySupervisor: vi.fn(),
}))

vi.mock('@/components/media/ArticleCard', () => ({
  ArticleCard: vi.fn(({ article }) => (
    <div data-testid="article-card">{article.title}</div>
  )),
}))

vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  )),
}))

const mockSlugs = ['yamada-taro', 'suzuki-hanako']
vi.mocked(getAllExpertSlugs).mockResolvedValue(mockSlugs)

describe('ExpertDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('執筆者の詳細と記事を表示する', async () => {
    const mockExpert = {
      id: '1',
      name: '山田太郎',
      slug: 'yamada-taro',
      role: ['執筆者' as const],
      profile: 'ブロックチェーン技術の専門家。\n10年以上の開発経験を持つ。',
      avatar: {
        url: 'https://example.com/avatar.jpg',
        width: 200,
        height: 200,
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
          title: 'ビットコインの未来',
          slug: 'bitcoin-future',
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '記事内容',
          heroImage: { url: 'https://example.com/image1.jpg', width: 800, height: 600 },
          category: { id: '1', name: 'ビットコイン', slug: 'bitcoin', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
          tags: [],
          author: mockExpert,
          publishedAt: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          title: 'DeFiの基礎知識',
          slug: 'defi-basics',
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '記事内容',
          heroImage: { url: 'https://example.com/image2.jpg', width: 800, height: 600 },
          category: { id: '2', name: 'DeFi', slug: 'defi', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
          tags: [],
          author: mockExpert,
          publishedAt: '2023-01-02T00:00:00.000Z',
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z',
          revisedAt: '2023-01-02T00:00:00.000Z',
        },
      ],
      totalCount: 2,
      offset: 0,
      limit: 20,
    }

    const { getExpertBySlug, getMediaArticlesByAuthor, getMediaArticlesBySupervisor } = await import('@/lib/microcms')
    vi.mocked(getExpertBySlug).mockResolvedValue(mockExpert)
    vi.mocked(getMediaArticlesByAuthor).mockResolvedValue(mockArticles)
    vi.mocked(getMediaArticlesBySupervisor).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 0,
    })

    const Component = await ExpertDetailPage({ params: { slug: 'yamada-taro' } })
    render(Component)

    // プロフィール情報の検証
    expect(screen.getByText('山田太郎')).toBeInTheDocument()
    expect(screen.getByText('執筆者')).toBeInTheDocument()
    expect(screen.getByText(/ブロックチェーン技術の専門家/)).toBeInTheDocument()
    expect(screen.getByText(/10年以上の開発経験を持つ/)).toBeInTheDocument()

    // アバター画像の検証
    const avatar = screen.getByRole('img', { name: '山田太郎' })
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')

    // 記事一覧の検証
    expect(screen.getByText('山田太郎の記事')).toBeInTheDocument()
    expect(screen.getByText('（2件）')).toBeInTheDocument()
    expect(screen.getAllByTestId('article-card')).toHaveLength(2)
    expect(screen.getByText('ビットコインの未来')).toBeInTheDocument()
    expect(screen.getByText('DeFiの基礎知識')).toBeInTheDocument()
  })

  it('執筆者と監修者の両方の役割を持つ場合', async () => {
    const mockExpert = {
      id: '1',
      name: '鈴木花子',
      slug: 'suzuki-hanako',
      role: ['執筆者' as const, '監修者' as const],
      profile: '専門家',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const authorArticles = {
      contents: [
        {
          id: '1',
          title: '執筆記事1',
          slug: 'article-1',
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '内容',
          heroImage: { url: 'https://example.com/image.jpg', width: 800, height: 600 },
          publishedAt: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      totalCount: 1,
      offset: 0,
      limit: 20,
    }

    const supervisorArticles = {
      contents: [
        {
          id: '2',
          title: '監修記事1',
          slug: 'article-2',
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '内容',
          heroImage: { url: 'https://example.com/image.jpg', width: 800, height: 600 },
          publishedAt: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      totalCount: 1,
      offset: 0,
      limit: 20,
    }

    const { getExpertBySlug, getMediaArticlesByAuthor, getMediaArticlesBySupervisor } = await import('@/lib/microcms')
    vi.mocked(getExpertBySlug).mockResolvedValue(mockExpert)
    vi.mocked(getMediaArticlesByAuthor).mockResolvedValue(authorArticles)
    vi.mocked(getMediaArticlesBySupervisor).mockResolvedValue(supervisorArticles)

    const Component = await ExpertDetailPage({ params: { slug: 'suzuki-hanako' } })
    render(Component)

    // 両方の役割が表示される
    const roles = screen.getAllByText(/執筆者|監修者/)
    expect(roles).toHaveLength(2)

    // 両方の記事が表示される
    expect(screen.getAllByTestId('article-card')).toHaveLength(2)
    expect(screen.getByText('執筆記事1')).toBeInTheDocument()
    expect(screen.getByText('監修記事1')).toBeInTheDocument()
  })

  it('記事がない場合の表示', async () => {
    const mockExpert = {
      id: '1',
      name: '田中一郎',
      slug: 'tanaka-ichiro',
      role: ['監修者' as const],
      profile: '専門家',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const { getExpertBySlug, getMediaArticlesByAuthor, getMediaArticlesBySupervisor } = await import('@/lib/microcms')
    vi.mocked(getExpertBySlug).mockResolvedValue(mockExpert)
    vi.mocked(getMediaArticlesByAuthor).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 0,
    })
    vi.mocked(getMediaArticlesBySupervisor).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 0,
    })

    const Component = await ExpertDetailPage({ params: { slug: 'tanaka-ichiro' } })
    render(Component)

    expect(screen.getByText('田中一郎の記事')).toBeInTheDocument()
    expect(screen.queryByText(/（\d+件）/)).not.toBeInTheDocument()
    expect(screen.getByText('まだ記事が投稿されていません。')).toBeInTheDocument()
  })

  it('存在しないスラッグの場合は404を返す', async () => {
    const { getExpertBySlug } = await import('@/lib/microcms')
    vi.mocked(getExpertBySlug).mockRejectedValue(new Error('Not found'))

    await ExpertDetailPage({ params: { slug: 'not-found' } })

    expect(notFound).toHaveBeenCalled()
  })

  it('generateStaticParamsが正しく動作する', async () => {
    const result = await generateStaticParams()

    expect(result).toEqual([
      { slug: 'yamada-taro' },
      { slug: 'suzuki-hanako' },
    ])
  })

  it('generateMetadataが正しくメタデータを生成する', async () => {
    const mockExpert = {
      id: '1',
      name: '山田太郎',
      slug: 'yamada-taro',
      role: ['執筆者' as const],
      profile: 'ブロックチェーン技術の専門家',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      revisedAt: '2023-01-01T00:00:00.000Z',
    }

    const { getExpertBySlug } = await import('@/lib/microcms')
    vi.mocked(getExpertBySlug).mockResolvedValue(mockExpert)

    const metadata = await generateMetadata({ params: { slug: 'yamada-taro' } })

    expect(metadata).toEqual({
      title: '山田太郎 | 執筆者・監修者 | 暗号資産総合メディア',
      description: 'ブロックチェーン技術の専門家',
    })
  })

  it('generateMetadataがエラー時にデフォルトメタデータを返す', async () => {
    const { getExpertBySlug } = await import('@/lib/microcms')
    vi.mocked(getExpertBySlug).mockRejectedValue(new Error('Not found'))

    const metadata = await generateMetadata({ params: { slug: 'not-found' } })

    expect(metadata).toEqual({
      title: '執筆者・監修者 | 暗号資産総合メディア',
    })
  })
})