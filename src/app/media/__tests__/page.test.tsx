/**
 * media/page.tsx の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MediaHomePage from '../page'
import { mockMediaArticles } from '@/test/factories/media-articles'

// microCMSのAPIクライアントをモック化
vi.mock('@/lib/microcms/media-articles', () => ({
  getMediaArticlesList: vi.fn(),
}))
const { getMediaArticlesList } = vi.mocked(
  await import('@/lib/microcms/media-articles')
)

describe('MediaHomePage', () => {
  it('新着記事一覧のタイトルが表示される', async () => {
    // APIからのレスポンスをモック
    getMediaArticlesList.mockResolvedValue({
      contents: mockMediaArticles(5),
      totalCount: 5,
      limit: 10,
      offset: 0,
    })

    // 非同期コンポーネントをレンダリング
    const Page = await MediaHomePage()
    render(Page)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('新着記事一覧')
  })

  it('記事が0件の場合にメッセージが表示される', async () => {
    // APIからのレスポンスをモック（記事0件）
    getMediaArticlesList.mockResolvedValue({
      contents: [],
      totalCount: 0,
      limit: 10,
      offset: 0,
    })

    const Page = await MediaHomePage()
    render(Page)

    expect(
      screen.getByText('記事が見つかりませんでした。')
    ).toBeInTheDocument()
  })

  it('取得した記事がグリッド表示される', async () => {
    const articles = mockMediaArticles(3)
    getMediaArticlesList.mockResolvedValue({
      contents: articles,
      totalCount: 3,
      limit: 10,
      offset: 0,
    })

    const Page = await MediaHomePage()
    render(Page)

    // 各記事のタイトルがレンダリングされているか確認
    for (const article of articles) {
      expect(screen.getByText(article.title)).toBeInTheDocument()
    }
  })
})
