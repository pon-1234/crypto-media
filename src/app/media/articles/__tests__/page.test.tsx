/**
 * メディア記事一覧ページのテスト
 * @doc DEVELOPMENT_GUIDE.md#メディア記事一覧
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MediaArticlesPage from '../page'

// microCMS APIのモック
vi.mock('@/lib/microcms', () => ({
  getMediaArticlesList: vi.fn(),
  getOptimizedImageUrl: vi.fn((url) => url),
}))

// import後にモックを取得
import { getMediaArticlesList } from '@/lib/microcms'

describe('MediaArticlesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('記事一覧を正しく表示する', async () => {
    const mockArticles = {
      contents: [
        {
          id: 'article-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          title: 'テスト記事1',
          slug: 'test-article-1',
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '<p>内容1</p>',
          heroImage: {
            url: 'https://example.com/image1.jpg',
            height: 720,
            width: 1280,
          },
        },
        {
          id: 'article-2',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          publishedAt: '2024-01-02T00:00:00.000Z',
          revisedAt: '2024-01-02T00:00:00.000Z',
          title: 'テスト記事2',
          slug: 'test-article-2',
          type: 'survey_report' as const,
          membershipLevel: 'paid' as const,
          content: '<p>内容2</p>',
          heroImage: {
            url: 'https://example.com/image2.jpg',
            height: 720,
            width: 1280,
          },
        },
      ],
      totalCount: 2,
      offset: 0,
      limit: 20,
    }

    vi.mocked(getMediaArticlesList).mockResolvedValueOnce(mockArticles)

    const Page = await MediaArticlesPage()
    render(Page)

    // ページタイトルとコンテンツの確認
    expect(
      screen.getByRole('heading', { name: '記事一覧' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '暗号資産・ブロックチェーンに関する最新の記事、調査レポート、お知らせをお届けします。'
      )
    ).toBeInTheDocument()

    // 記事カードが表示されることを確認
    expect(screen.getByText('テスト記事1')).toBeInTheDocument()
    expect(screen.getByText('テスト記事2')).toBeInTheDocument()

    // APIが正しく呼ばれたことを確認
    expect(getMediaArticlesList).toHaveBeenCalledWith({
      limit: 20,
      orders: '-publishedAt',
    })
  })

  it('記事がない場合は適切なメッセージを表示する', async () => {
    const mockArticles = {
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 20,
    }

    vi.mocked(getMediaArticlesList).mockResolvedValueOnce(mockArticles)

    const Page = await MediaArticlesPage()
    render(Page)

    expect(screen.getByText('記事がありません。')).toBeInTheDocument()
  })

  it('ページネーション情報を表示する', async () => {
    const mockArticles = {
      contents: Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `article-${i}`,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          title: `テスト記事${i}`,
          slug: `test-article-${i}`,
          type: 'article' as const,
          membershipLevel: 'public' as const,
          content: '<p>内容</p>',
          heroImage: {
            url: 'https://example.com/image.jpg',
            height: 720,
            width: 1280,
          },
        })),
      totalCount: 50,
      offset: 0,
      limit: 20,
    }

    vi.mocked(getMediaArticlesList).mockResolvedValueOnce(mockArticles)

    const Page = await MediaArticlesPage()
    render(Page)

    expect(
      screen.getByText('全50件中 20件を表示しています')
    ).toBeInTheDocument()
  })

  it('APIエラーの場合はエラーをスローする', async () => {
    const mockError = new Error('API Error')
    vi.mocked(getMediaArticlesList).mockRejectedValueOnce(mockError)

    // エラーがスローされることを確認
    await expect(MediaArticlesPage()).rejects.toThrow('API Error')
  })
})
