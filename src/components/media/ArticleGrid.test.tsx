import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleGrid } from './ArticleGrid'
import type { MediaArticle } from '@/lib/schema'

// Mock ArticleCard component
vi.mock('./ArticleCard', () => ({
  ArticleCard: ({ article }: { article: MediaArticle }) => (
    <div data-testid="article-card">{article.title}</div>
  ),
}))

describe('ArticleGrid', () => {
  const mockArticles: MediaArticle[] = [
    {
      id: '1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
      title: 'Test Article 1',
      slug: 'test-article-1',
      content: 'Content 1',
      heroImage: {
        url: 'https://example.com/image1.jpg',
        height: 600,
        width: 800,
      },
      type: 'media_news',
      membershipLevel: 'public',
      category: {
        id: 'cat1',
        name: 'Category 1',
        slug: 'category-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        publishedAt: '2024-01-01T00:00:00.000Z',
        revisedAt: '2024-01-01T00:00:00.000Z',
      },
      tags: [],
    },
    {
      id: '2',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      publishedAt: '2024-01-02T00:00:00.000Z',
      revisedAt: '2024-01-02T00:00:00.000Z',
      title: 'Test Article 2',
      slug: 'test-article-2',
      content: 'Content 2',
      heroImage: {
        url: 'https://example.com/image2.jpg',
        height: 600,
        width: 800,
      },
      type: 'article',
      membershipLevel: 'paid',
      category: {
        id: 'cat2',
        name: 'Category 2',
        slug: 'category-2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        publishedAt: '2024-01-01T00:00:00.000Z',
        revisedAt: '2024-01-01T00:00:00.000Z',
      },
      tags: [],
    },
  ]

  it('renders article cards for each article', () => {
    render(<ArticleGrid articles={mockArticles} />)

    const articleCards = screen.getAllByTestId('article-card')
    expect(articleCards).toHaveLength(2)
    expect(screen.getByText('Test Article 1')).toBeInTheDocument()
    expect(screen.getByText('Test Article 2')).toBeInTheDocument()
  })

  it('shows empty state when no articles', () => {
    render(<ArticleGrid articles={[]} />)

    expect(
      screen.getByText('記事が見つかりませんでした。')
    ).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ArticleGrid articles={mockArticles} className="custom-grid" />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('custom-grid')
  })

  it('applies default grid columns', () => {
    const { container } = render(<ArticleGrid articles={mockArticles} />)

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('md:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('applies custom grid columns', () => {
    const { container } = render(
      <ArticleGrid
        articles={mockArticles}
        columns={{ sm: 2, md: 3, lg: 4 }}
      />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-2')
    expect(grid).toHaveClass('md:grid-cols-3')
    expect(grid).toHaveClass('lg:grid-cols-4')
  })

  it('renders with gap between items', () => {
    const { container } = render(<ArticleGrid articles={mockArticles} />)

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('gap-6')
  })
})