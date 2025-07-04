import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleCardWithHighlight } from '../ArticleCardWithHighlight'
import type { MediaArticle } from '@/lib/schema/article.schema'

// Mock highlightSearchQuery
vi.mock('@/lib/microcms', () => ({
  highlightSearchQuery: vi.fn((text: string, query: string) => {
    if (!query) return [text]
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part: string, index: number) => {
      if (index % 2 === 1) {
        return {
          type: 'mark',
          key: index,
          text: part,
        }
      }
      return part
    })
  }),
}))

const mockArticle: MediaArticle = {
  id: '1',
  type: 'article',
  title: 'ビットコインの基礎知識',
  slug: 'bitcoin-basics',
  content: 'コンテンツ',
  heroImage: {
    url: 'https://example.com/thumbnail.jpg',
    width: 800,
    height: 600,
  },
  category: {
    id: 'cat1',
    name: '基礎知識',
    slug: 'basics',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  tags: [
    {
      id: 'tag1',
      name: 'ビットコイン',
      slug: 'bitcoin',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 'tag2',
      name: '仮想通貨',
      slug: 'crypto',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ],
  publishedAt: '2024-01-01T00:00:00.000Z',
  membershipLevel: 'public',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('ArticleCardWithHighlight', () => {
  it('記事カードが正しくレンダリングされる', () => {
    render(<ArticleCardWithHighlight article={mockArticle} />)

    expect(screen.getByText('ビットコインの基礎知識')).toBeInTheDocument()
    expect(screen.getByText('基礎知識')).toBeInTheDocument()
    expect(screen.getByText('#ビットコイン')).toBeInTheDocument()
    expect(screen.getByText('#仮想通貨')).toBeInTheDocument()
  })

  it('サムネイル画像が表示される', () => {
    render(<ArticleCardWithHighlight article={mockArticle} />)

    const image = screen.getByAltText('ビットコインの基礎知識')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src')
    expect(image.getAttribute('src')).toContain('thumbnail.jpg')
  })

  it('有料会員限定バッジが表示される', () => {
    const paidArticle = {
      ...mockArticle,
      membershipLevel: 'paid' as const,
    }

    render(<ArticleCardWithHighlight article={paidArticle} />)

    expect(screen.getByText('有料会員限定')).toBeInTheDocument()
  })

  it('検索キーワードがハイライトされる', () => {
    render(
      <ArticleCardWithHighlight article={mockArticle} query="ビットコイン" />
    )

    const marks = screen.getAllByText('ビットコイン')
    const highlightedElements = marks.filter((el) => el.tagName === 'MARK')
    expect(highlightedElements.length).toBeGreaterThan(0)
  })

  it('説明文がない場合も正しく表示される', () => {
    const articleWithoutDescription = {
      ...mockArticle,
    }

    render(<ArticleCardWithHighlight article={articleWithoutDescription} />)

    expect(screen.getByText('ビットコインの基礎知識')).toBeInTheDocument()
  })

  it('タグがない場合も正しく表示される', () => {
    const articleWithoutTags = {
      ...mockArticle,
      tags: [],
    }

    render(<ArticleCardWithHighlight article={articleWithoutTags} />)

    expect(screen.queryByText('#ビットコイン')).not.toBeInTheDocument()
    expect(screen.queryByText('#仮想通貨')).not.toBeInTheDocument()
  })

  it('カテゴリがない場合も正しく表示される', () => {
    const articleWithoutCategory = {
      ...mockArticle,
      category: undefined,
    }

    render(<ArticleCardWithHighlight article={articleWithoutCategory} />)

    expect(screen.queryByText('基礎知識')).not.toBeInTheDocument()
  })

  it('リンクが正しいURLを持つ', () => {
    render(<ArticleCardWithHighlight article={mockArticle} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/media/articles/bitcoin-basics')
  })

  it('公開日が正しくフォーマットされる', () => {
    render(<ArticleCardWithHighlight article={mockArticle} />)

    expect(screen.getByText('2024/1/1')).toBeInTheDocument()
  })

  it('検索クエリがない場合はハイライトされない', () => {
    render(<ArticleCardWithHighlight article={mockArticle} />)

    const marks = screen.queryAllByRole('mark')
    expect(marks).toHaveLength(0)
  })
})
