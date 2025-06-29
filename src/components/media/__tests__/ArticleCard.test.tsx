/**
 * ArticleCardコンポーネントのテスト
 * @doc DEVELOPMENT_GUIDE.md#メディア記事一覧
 * @issue #5 - メディア記事一覧・詳細ページの実装
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ArticleCard } from '../ArticleCard'
import type { MediaArticle } from '@/lib/schema'

// microCMSクライアントのモック
vi.mock('@/lib/microcms', () => ({
  getOptimizedImageUrl: vi.fn((url) => url),
}))

// date-fnsのモック
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2024年01月15日'),
}))

// date-fns/localeのモック
vi.mock('date-fns/locale', () => ({
  ja: {},
}))

/**
 * テスト用の記事データを作成
 */
const createMockArticle = (overrides?: Partial<MediaArticle>): MediaArticle => ({
  id: 'test-article-1',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  publishedAt: '2024-01-15T00:00:00.000Z',
  revisedAt: '2024-01-15T00:00:00.000Z',
  title: 'テスト記事タイトル',
  slug: 'test-article',
  type: 'article',
  membershipLevel: 'public',
  content: '<p>テスト記事の内容</p>',
  heroImage: {
    url: 'https://example.com/image.jpg',
    height: 720,
    width: 1280,
  },
  category: {
    id: 'category-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
    name: 'ビットコイン',
    slug: 'bitcoin',
  },
  tags: [
    {
      id: 'tag-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
      name: '暗号資産',
      slug: 'crypto',
    },
    {
      id: 'tag-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-01T00:00:00.000Z',
      revisedAt: '2024-01-01T00:00:00.000Z',
      name: 'ブロックチェーン',
      slug: 'blockchain',
    },
  ],
  author: {
    id: 'author-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
    name: '田中太郎',
    slug: 'tanaka-taro',
    role: ['執筆者'],
    profile: '<p>暗号資産専門ライター</p>',
    avatar: {
      url: 'https://example.com/avatar.jpg',
      height: 100,
      width: 100,
    },
  },
  ...overrides,
})

describe('ArticleCard', () => {
  it('記事の基本情報を表示する', () => {
    const article = createMockArticle()
    render(<ArticleCard article={article} />)

    // タイトルが表示される
    expect(screen.getByRole('heading', { name: 'テスト記事タイトル' })).toBeInTheDocument()

    // 公開日が表示される
    expect(screen.getByText('2024年01月15日')).toBeInTheDocument()

    // カテゴリが表示される
    expect(screen.getByText('ビットコイン')).toBeInTheDocument()

    // 記事タイプラベルが表示される
    expect(screen.getByText('記事')).toBeInTheDocument()

    // リンクが正しく設定される
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/media/articles/test-article')
  })

  it('有料会員限定記事の場合、ラベルを表示する', () => {
    const article = createMockArticle({
      membershipLevel: 'paid',
    })
    render(<ArticleCard article={article} />)

    expect(screen.getByText('有料会員限定')).toBeInTheDocument()
  })

  it('調査レポートタイプの場合、正しいラベルを表示する', () => {
    const article = createMockArticle({
      type: 'survey_report',
    })
    render(<ArticleCard article={article} />)

    expect(screen.getByText('調査レポート')).toBeInTheDocument()
  })

  it('メディアお知らせタイプの場合、正しいラベルを表示する', () => {
    const article = createMockArticle({
      type: 'media_news',
    })
    render(<ArticleCard article={article} />)

    expect(screen.getByText('お知らせ')).toBeInTheDocument()
  })

  it('タグを最大3つまで表示する', () => {
    const article = createMockArticle({
      tags: [
        {
          id: 'tag-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          name: 'タグ1',
          slug: 'tag1',
        },
        {
          id: 'tag-2',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          name: 'タグ2',
          slug: 'tag2',
        },
        {
          id: 'tag-3',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          name: 'タグ3',
          slug: 'tag3',
        },
        {
          id: 'tag-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z',
          name: 'タグ4',
          slug: 'tag4',
        },
      ],
    })
    render(<ArticleCard article={article} />)

    expect(screen.getByText('#タグ1')).toBeInTheDocument()
    expect(screen.getByText('#タグ2')).toBeInTheDocument()
    expect(screen.getByText('#タグ3')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('執筆者情報を表示する', () => {
    const article = createMockArticle()
    render(<ArticleCard article={article} />)

    expect(screen.getByText('田中太郎')).toBeInTheDocument()
    expect(screen.getByAltText('田中太郎')).toBeInTheDocument()
  })

  it('執筆者情報がない場合でも正常に表示される', () => {
    const article = createMockArticle({
      author: undefined,
    })
    render(<ArticleCard article={article} />)

    expect(screen.queryByText('田中太郎')).not.toBeInTheDocument()
  })

  it('カテゴリがない場合でも正常に表示される', () => {
    const article = createMockArticle({
      category: undefined,
    })
    render(<ArticleCard article={article} />)

    expect(screen.queryByText('ビットコイン')).not.toBeInTheDocument()
  })

  it('タグがない場合でも正常に表示される', () => {
    const article = createMockArticle({
      tags: undefined,
    })
    render(<ArticleCard article={article} />)

    expect(screen.queryByText('#暗号資産')).not.toBeInTheDocument()
  })

  it('カスタムクラス名を適用できる', () => {
    const article = createMockArticle()
    const { container } = render(<ArticleCard article={article} className="custom-class" />)

    const articleElement = container.querySelector('article')
    expect(articleElement).toHaveClass('custom-class')
  })
})