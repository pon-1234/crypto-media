/**
 * 執筆者・監修者一覧ページのテスト
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExpertsIndexPage from '../page'

// microCMSクライアントのモック
vi.mock('@/lib/microcms', () => ({
  getExperts: vi.fn(),
  stripHtmlTags: vi.fn((text: string) => text),
}))

// next/imageのモック
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  )),
}))

describe('ExpertsIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('執筆者・監修者一覧を表示する', async () => {
    const { getExperts } = await import('@/lib/microcms')
    vi.mocked(getExperts).mockResolvedValue({
      contents: [
        {
          id: '1',
          name: '山田太郎',
          slug: 'yamada-taro',
          role: ['執筆者'],
          profile: 'ブロックチェーン技術の専門家。10年以上の開発経験を持つ。',
          avatar: {
            url: 'https://example.com/avatar1.jpg',
            width: 200,
            height: 200,
          },
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          publishedAt: '2023-01-01T00:00:00.000Z',
          revisedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: '鈴木花子',
          slug: 'suzuki-hanako',
          role: ['執筆者', '監修者'],
          profile: '暗号資産アナリスト。金融業界での豊富な経験を活かした分析が得意。',
          avatar: {
            url: 'https://example.com/avatar2.jpg',
            width: 200,
            height: 200,
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

    const Component = await ExpertsIndexPage()
    render(Component)

    expect(screen.getByText('執筆者・監修者一覧')).toBeInTheDocument()
    expect(screen.getByText('山田太郎')).toBeInTheDocument()
    expect(screen.getByText('鈴木花子')).toBeInTheDocument()

    // ロールバッジの検証
    expect(screen.getAllByText('執筆者')).toHaveLength(2)
    expect(screen.getByText('監修者')).toBeInTheDocument()

    // プロフィールの検証
    expect(screen.getByText(/ブロックチェーン技術の専門家/)).toBeInTheDocument()
    expect(screen.getByText(/暗号資産アナリスト/)).toBeInTheDocument()

    // リンクの検証
    const yamadaLink = screen.getByRole('link', { name: /山田太郎/ })
    expect(yamadaLink).toHaveAttribute('href', '/media/experts/yamada-taro')

    const suzukiLink = screen.getByRole('link', { name: /鈴木花子/ })
    expect(suzukiLink).toHaveAttribute('href', '/media/experts/suzuki-hanako')

    // アバター画像の検証
    const avatars = screen.getAllByRole('img')
    expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar1.jpg')
    expect(avatars[0]).toHaveAttribute('alt', '山田太郎')
    expect(avatars[1]).toHaveAttribute('src', 'https://example.com/avatar2.jpg')
    expect(avatars[1]).toHaveAttribute('alt', '鈴木花子')
  })

  it('アバター画像がない執筆者も正しく表示する', async () => {
    const { getExperts } = await import('@/lib/microcms')
    vi.mocked(getExperts).mockResolvedValue({
      contents: [
        {
          id: '1',
          name: '田中一郎',
          slug: 'tanaka-ichiro',
          role: ['監修者'],
          profile: 'セキュリティの専門家',
          avatar: undefined,
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

    const Component = await ExpertsIndexPage()
    render(Component)

    expect(screen.getByText('田中一郎')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('執筆者・監修者が存在しない場合の表示', async () => {
    const { getExperts } = await import('@/lib/microcms')
    vi.mocked(getExperts).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    const Component = await ExpertsIndexPage()
    render(Component)

    expect(screen.getByText('執筆者・監修者一覧')).toBeInTheDocument()
    expect(
      screen.getByText('執筆者・監修者が登録されていません。')
    ).toBeInTheDocument()
  })

  it('正しいAPIパラメータで執筆者・監修者を取得する', async () => {
    const { getExperts } = await import('@/lib/microcms')
    vi.mocked(getExperts).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 100,
    })

    await ExpertsIndexPage()

    expect(getExperts).toHaveBeenCalledWith({
      fields: ['id', 'name', 'slug', 'role', 'profile', 'avatar'],
      limit: 100,
    })
  })
})