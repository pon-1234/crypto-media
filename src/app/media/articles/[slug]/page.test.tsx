import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MediaArticleDetailPage from './page'

// モックの設定
vi.mock('@/lib/microcms', () => ({
  getMediaArticleBySlug: vi.fn(),
  getAllMediaArticleSlugs: vi.fn(),
  getRelatedArticles: vi.fn(),
  getOptimizedImageUrl: vi.fn((url: string) => url),
}))

vi.mock('@/lib/auth/membership', () => ({
  hasAccess: vi.fn(),
}))

vi.mock('@/components/media/ArticleCard', () => ({
  ArticleCard: vi.fn(() => <div data-testid="article-card">Article Card</div>),
}))

interface PaywallProps {
  title: string
  preview: string
}

vi.mock('@/components/media/Paywall', () => ({
  Paywall: vi.fn(({ title, preview }: PaywallProps) => (
    <div data-testid="paywall">
      <h1>{title}</h1>
      <div>{preview}</div>
    </div>
  )),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

interface NextImageProps {
  src: string
  alt: string
}

vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt }: NextImageProps) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />
  }),
}))

import { getMediaArticleBySlug, getRelatedArticles } from '@/lib/microcms'
import { hasAccess } from '@/lib/auth/membership'
import { notFound } from 'next/navigation'

// DOMPurifyのモック
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((content: string) => content),
  },
}))

describe('MediaArticleDetailPage', () => {
  const mockArticle = {
    id: '1',
    slug: 'test-article',
    title: 'テスト記事',
    content: '<p>これは記事の本文です。</p>',
    previewContent: '<p>これはプレビューコンテンツです。</p>',
    membershipLevel: 'public' as const,
    type: 'media_news' as const,
    heroImage: {
      url: 'https://example.com/image.jpg',
      height: 630,
      width: 1200,
    },
    createdAt: '2025-06-30T09:00:00Z',
    publishedAt: '2025-06-30T10:00:00Z',
    updatedAt: '2025-06-30T10:00:00Z',
    author: {
      id: 'author1',
      createdAt: '2025-06-30T09:00:00Z',
      updatedAt: '2025-06-30T09:00:00Z',
      name: '著者名',
      slug: 'author-1',
      role: ['執筆者'] as Array<'執筆者' | '監修者'>,
      profile: '著者のプロフィール',
      avatar: {
        url: 'https://example.com/author.jpg',
        height: 100,
        width: 100,
      },
    },
    supervisor: undefined,
    tags: [
      {
        id: 'tag1',
        createdAt: '2025-06-30T09:00:00Z',
        updatedAt: '2025-06-30T09:00:00Z',
        name: 'タグ1',
        slug: 'tag-1',
      },
    ],
    category: {
      id: 'cat1',
      createdAt: '2025-06-30T09:00:00Z',
      updatedAt: '2025-06-30T09:00:00Z',
      name: 'カテゴリ1',
      slug: 'category-1',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('公開記事の場合', () => {
    beforeEach(() => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValue({
        ...mockArticle,
        membershipLevel: 'public',
      })
      vi.mocked(getRelatedArticles).mockResolvedValue([])
      vi.mocked(hasAccess).mockResolvedValue(true)
    })

    it('記事の全文を表示する', async () => {
      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      const { container } = render(Component)

      // 記事本文が表示されていることを確認
      const articleBody = container.querySelector('.article-body')
      expect(articleBody).toBeInTheDocument()
      expect(articleBody?.innerHTML).toContain('これは記事の本文です。')
    })

    it('ペイウォールを表示しない', async () => {
      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      render(Component)

      expect(screen.queryByTestId('paywall')).not.toBeInTheDocument()
    })
  })

  describe('有料記事の場合', () => {
    beforeEach(() => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValue({
        ...mockArticle,
        membershipLevel: 'paid',
      })
      vi.mocked(getRelatedArticles).mockResolvedValue([])
    })

    it('有料会員の場合、記事の全文を表示する', async () => {
      vi.mocked(hasAccess).mockResolvedValue(true)

      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      const { container } = render(Component)

      const articleBody = container.querySelector('.article-body')
      expect(articleBody).toBeInTheDocument()
      expect(articleBody?.innerHTML).toContain('これは記事の本文です。')
    })

    it('非有料会員の場合、ペイウォールを表示する', async () => {
      vi.mocked(hasAccess).mockResolvedValue(false)

      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      render(Component)

      expect(screen.getByTestId('paywall')).toBeInTheDocument()
      // ペイウォール内のタイトルを確認
      const paywall = screen.getByTestId('paywall')
      expect(paywall).toHaveTextContent('テスト記事')
    })

    it('プレビューコンテンツがある場合、それを表示する', async () => {
      vi.mocked(hasAccess).mockResolvedValue(false)
      vi.mocked(getMediaArticleBySlug).mockResolvedValue({
        ...mockArticle,
        membershipLevel: 'paid',
        previewContent: '<p>カスタムプレビュー</p>',
      })

      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      render(Component)

      expect(screen.getByText(/カスタムプレビュー/)).toBeInTheDocument()
    })

    it('プレビューコンテンツがない場合、本文の一部を表示する', async () => {
      vi.mocked(hasAccess).mockResolvedValue(false)
      vi.mocked(getMediaArticleBySlug).mockResolvedValue({
        ...mockArticle,
        membershipLevel: 'paid',
        previewContent: undefined,
        content: '<p>長い記事の本文がここに入ります。</p>',
      })

      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      render(Component)

      const paywall = screen.getByTestId('paywall')
      expect(paywall.innerHTML).toContain('長い記事の本文がここに入ります。')
      expect(paywall.innerHTML).toContain('...')
    })
  })

  describe('JSON-LD構造化データ', () => {
    it('有料記事の場合、ペイウォール情報を含む', async () => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValue({
        ...mockArticle,
        membershipLevel: 'paid',
      })
      vi.mocked(getRelatedArticles).mockResolvedValue([])
      vi.mocked(hasAccess).mockResolvedValue(false)

      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      const { container } = render(Component)

      const scriptTag = container.querySelector(
        'script[type="application/ld+json"]'
      )
      expect(scriptTag).toBeInTheDocument()

      const jsonLd = JSON.parse(scriptTag?.textContent || '{}')
      expect(jsonLd.isAccessibleForFree).toBe('False')
      expect(jsonLd.hasPart).toEqual([
        {
          '@type': 'WebPageElement',
          isAccessibleForFree: 'False',
          cssSelector: '.article-body',
        },
      ])
    })

    it('公開記事の場合、ペイウォール情報を含まない', async () => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValue({
        ...mockArticle,
        membershipLevel: 'public',
      })
      vi.mocked(getRelatedArticles).mockResolvedValue([])
      vi.mocked(hasAccess).mockResolvedValue(true)

      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      const { container } = render(Component)

      const scriptTag = container.querySelector(
        'script[type="application/ld+json"]'
      )
      const jsonLd = JSON.parse(scriptTag?.textContent || '{}')

      expect(jsonLd.isAccessibleForFree).toBeUndefined()
      expect(jsonLd.hasPart).toBeUndefined()
    })
  })

  describe('エラーハンドリング', () => {
    it('記事が見つからない場合、notFoundを呼ぶ', async () => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValue(null)

      // notFound()はNext.jsのエラーページをトリガーするため、
      // 実際にはコンポーネントが返されないことを想定
      try {
        await MediaArticleDetailPage({
          params: { slug: 'non-existent' },
        })
      } catch {
        // notFoundは例外をスローする可能性がある
      }

      expect(notFound).toHaveBeenCalled()
    })

    it('APIエラーの場合、エラーを再スローする', async () => {
      const error = new Error('API Error')
      vi.mocked(getMediaArticleBySlug).mockRejectedValue(error)

      await expect(
        MediaArticleDetailPage({
          params: { slug: 'test-article' },
        })
      ).rejects.toThrow('API Error')
    })
  })

  describe('メタデータ要素', () => {
    it('有料会員限定バッジを表示する', async () => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValue({
        ...mockArticle,
        membershipLevel: 'paid',
      })
      vi.mocked(getRelatedArticles).mockResolvedValue([])
      vi.mocked(hasAccess).mockResolvedValue(true)

      const Component = await MediaArticleDetailPage({
        params: { slug: 'test-article' },
      })

      render(Component)

      expect(screen.getByText('有料会員限定')).toBeInTheDocument()
    })
  })
})
