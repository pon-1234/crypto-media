import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchResultGrid } from '../SearchResultGrid'
import type { MediaArticle } from '@/lib/schema/article.schema'

// Mock ArticleCardWithHighlight
vi.mock('../ArticleCardWithHighlight', () => ({
  ArticleCardWithHighlight: ({ article, query }: { article: MediaArticle; query: string }) => (
    <div data-testid={`article-${article.id}`}>
      <div>Title: {article.title}</div>
      <div>Query: {query}</div>
    </div>
  ),
}))

const mockArticles: MediaArticle[] = [
  {
    id: '1',
    type: 'article',
    title: 'ビットコインの基礎',
    slug: 'bitcoin-basics',
    content: 'コンテンツ1',
    membershipLevel: 'public',
    heroImage: { url: 'https://example.com/image1.jpg', width: 800, height: 600 },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    type: 'article',
    title: 'イーサリアムの未来',
    slug: 'ethereum-future',
    content: 'コンテンツ2',
    membershipLevel: 'paid',
    heroImage: { url: 'https://example.com/image2.jpg', width: 800, height: 600 },
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    type: 'article',
    title: 'DeFiの仕組み',
    slug: 'defi-explained',
    content: 'コンテンツ3',
    membershipLevel: 'public',
    heroImage: { url: 'https://example.com/image3.jpg', width: 800, height: 600 },
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
]

describe('SearchResultGrid', () => {
  it('記事がグリッド表示される', () => {
    render(<SearchResultGrid articles={mockArticles} query="ビットコイン" />)

    expect(screen.getByTestId('article-1')).toBeInTheDocument()
    expect(screen.getByTestId('article-2')).toBeInTheDocument()
    expect(screen.getByTestId('article-3')).toBeInTheDocument()
  })

  it('各記事に検索クエリが渡される', () => {
    render(<SearchResultGrid articles={mockArticles} query="イーサリアム" />)

    const queryTexts = screen.getAllByText('Query: イーサリアム')
    expect(queryTexts).toHaveLength(3)
  })

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <SearchResultGrid articles={mockArticles} query="DeFi" className="custom-grid" />
    )

    const grid = container.firstChild
    expect(grid).toHaveClass('custom-grid')
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('gap-6')
  })

  it('空の記事リストも正しく処理される', () => {
    const { container } = render(<SearchResultGrid articles={[]} query="Web3" />)

    const grid = container.firstChild
    expect(grid?.childNodes).toHaveLength(0)
  })

  it('レスポンシブグリッドクラスが適用される', () => {
    const { container } = render(
      <SearchResultGrid articles={mockArticles} query="NFT" />
    )

    const grid = container.firstChild
    expect(grid).toHaveClass('md:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('記事の順番が保持される', () => {
    render(<SearchResultGrid articles={mockArticles} query="暗号資産" />)

    const articles = screen.getAllByText(/Title: /)
    expect(articles[0]).toHaveTextContent('Title: ビットコインの基礎')
    expect(articles[1]).toHaveTextContent('Title: イーサリアムの未来')
    expect(articles[2]).toHaveTextContent('Title: DeFiの仕組み')
  })
})