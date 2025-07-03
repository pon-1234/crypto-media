/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import MediaNewsDetailPage, { generateMetadata } from '../page'
import { getMediaArticleBySlug, getRelatedArticles } from '@/lib/microcms'
import { hasAccess } from '@/lib/auth/membership'
import type { MediaArticle } from '@/lib/schema'
import DOMPurify from 'isomorphic-dompurify'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('next/headers', () => ({
  draftMode: vi.fn(() => ({
    isEnabled: false,
    enable: vi.fn(),
    disable: vi.fn(),
  })),
}))

vi.mock('@/lib/microcms', () => ({
  getMediaArticleBySlug: vi.fn(),
  getRelatedArticles: vi.fn(),
  getOptimizedImageUrl: vi.fn((url) => url),
}))

vi.mock('@/lib/auth/membership', () => ({
  hasAccess: vi.fn(),
}))

vi.mock('@/components/media/ArticleCard', () => ({
  ArticleCard: vi.fn(({ article }) => (
    <div data-testid={`related-${article.id}`}>{article.title}</div>
  )),
}))

vi.mock('@/components/media/Paywall', () => ({
  Paywall: vi.fn(({ article }) => (
    <div data-testid="paywall">Paywall for {article.title}</div>
  )),
}))

vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((html) => html),
  },
}))

describe('MediaNewsDetailPage', () => {
  const mockArticle: MediaArticle = {
    id: '1',
    title: 'メディアニュース記事',
    slug: 'media-news-article',
    type: 'media_news',
    membershipLevel: 'public',
    content: '<p>記事の内容</p>',
    heroImage: { url: 'https://example.com/image.jpg', width: 1200, height: 630 },
    category: { id: 'cat1', name: 'お知らせ', slug: 'announcement', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    tags: [{ id: 'tag1', name: 'Update', slug: 'update', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }],
    author: { id: 'author1', name: '執筆者', slug: 'author', role: ['執筆者'], profile: '', avatar: { url: '', width: 100, height: 100 }, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    publishedAt: '2024-01-01T00:00:00Z',
    revisedAt: '2024-01-01T00:00:00Z',
  }

  const mockArticleWithSupervisor: MediaArticle = {
    ...mockArticle,
    supervisor: {
      id: 'supervisor1',
      name: '監修者',
      slug: 'supervisor',
      role: ['監修者'],
      profile: '',
      avatar: { url: '', width: 100, height: 100 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  }

  const mockRelatedArticles: MediaArticle[] = [
    { ...mockArticle, id: '2', title: '関連記事1', slug: 'related-1' },
    { ...mockArticle, id: '3', title: '関連記事2', slug: 'related-2' },
  ]

  it('メディアニュース記事を正しく表示する', async () => {
    vi.mocked(getMediaArticleBySlug).mockResolvedValue(mockArticle)
    vi.mocked(getRelatedArticles).mockResolvedValue(mockRelatedArticles)
    vi.mocked(hasAccess).mockResolvedValue(true)

    const page = await MediaNewsDetailPage({
      params: { slug: 'media-news-article' },
      searchParams: {},
    })

    expect(getMediaArticleBySlug).toHaveBeenCalledWith('media-news-article', undefined)
    expect(page).toMatchSnapshot()
  })

  it('supervisorとtagsを持つ記事を正しく表示する', async () => {
    vi.mocked(getMediaArticleBySlug).mockResolvedValue(mockArticleWithSupervisor)
    vi.mocked(getRelatedArticles).mockResolvedValue(mockRelatedArticles)
    vi.mocked(hasAccess).mockResolvedValue(true)

    const page = await MediaNewsDetailPage({
      params: { slug: 'media-news-article-with-supervisor' },
      searchParams: {},
    })

    expect(page).toMatchSnapshot()
  })

  it('関連記事の取得に失敗してもページが正常に表示される', async () => {
    vi.mocked(getMediaArticleBySlug).mockResolvedValue(mockArticle)
    vi.mocked(getRelatedArticles).mockRejectedValue(new Error('API Error'))
    vi.mocked(hasAccess).mockResolvedValue(true)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const page = await MediaNewsDetailPage({
      params: { slug: 'media-news-article' },
      searchParams: {},
    })

    expect(page).toMatchSnapshot()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch related articles:',
      expect.any(Error)
    )
    consoleErrorSpy.mockRestore()
  })

  it('type が media_news でない場合は notFound を呼ぶ', async () => {
    const nonNewsArticle = { ...mockArticle, type: 'article' as const }
    vi.mocked(getMediaArticleBySlug).mockResolvedValue(nonNewsArticle)

    await expect(
      MediaNewsDetailPage({
        params: { slug: 'not-news' },
        searchParams: {},
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
  })

  it('記事が見つからない場合は notFound を呼ぶ', async () => {
    vi.mocked(getMediaArticleBySlug).mockResolvedValue(null)

    await expect(
      MediaNewsDetailPage({
        params: { slug: 'not-found' },
        searchParams: {},
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
  })

  it('アクセス権限がない場合は Paywall を表示する', async () => {
    const paidArticle = { ...mockArticle, membershipLevel: 'paid' as const }
    vi.mocked(getMediaArticleBySlug).mockResolvedValue(paidArticle)
    vi.mocked(getRelatedArticles).mockResolvedValue([])
    vi.mocked(hasAccess).mockResolvedValue(false)

    const page = await MediaNewsDetailPage({
      params: { slug: 'paid-article' },
      searchParams: {},
    })

    expect(hasAccess).toHaveBeenCalledWith('paid')
    expect(page).toMatchSnapshot()
  })

  it('プレビューモードで記事を表示する', async () => {
    vi.mocked(draftMode).mockReturnValue({
      isEnabled: true,
      enable: vi.fn(),
      disable: vi.fn(),
    })
    vi.mocked(getMediaArticleBySlug).mockResolvedValue(mockArticle)
    vi.mocked(getRelatedArticles).mockResolvedValue([])
    vi.mocked(hasAccess).mockResolvedValue(true)

    await MediaNewsDetailPage({
      params: { slug: 'preview-article' },
      searchParams: { draftKey: 'test-key' },
    })

    expect(getMediaArticleBySlug).toHaveBeenCalledWith('preview-article', { draftKey: 'test-key' })
  })

  describe('generateMetadata', () => {
    let originalCI: string | undefined

    beforeEach(() => {
      originalCI = process.env.CI
      process.env.CI = undefined
    })

    afterEach(() => {
      process.env.CI = originalCI
    })

    it('正しいメタデータを生成する', async () => {
      vi.mocked(getMediaArticleBySlug).mockResolvedValue(mockArticle)
      vi.mocked(DOMPurify.sanitize).mockReturnValue('記事の内容')

      const metadata = await generateMetadata({
        params: { slug: 'media-news-article' },
        searchParams: {},
      })

      expect(metadata).toEqual({
        title: 'メディアニュース記事 | Crypto Media',
        description: '記事の内容',
        openGraph: expect.objectContaining({
          title: 'メディアニュース記事',
          type: 'article',
          authors: ['執筆者'],
        }),
        twitter: expect.objectContaining({
          card: 'summary_large_image',
          title: 'メディアニュース記事',
        }),
      })
    })

    it('authorがいない記事のメタデータを正しく生成する', async () => {
      const articleWithoutAuthor = { ...mockArticle, author: undefined }
      vi.mocked(getMediaArticleBySlug).mockResolvedValue(articleWithoutAuthor)

      const metadata = await generateMetadata({
        params: { slug: 'media-news-article' },
        searchParams: {},
      })

      // @ts-expect-error: `authors` is a valid property but may not be in the current type definition
      expect(metadata.openGraph?.authors).toBeUndefined()
    })

    it('type が media_news でない場合はエラーメタデータを返す', async () => {
      const nonNewsArticle = { ...mockArticle, type: 'article' as const }
      vi.mocked(getMediaArticleBySlug).mockResolvedValue(nonNewsArticle)

      const metadata = await generateMetadata({
        params: { slug: 'not-news' },
        searchParams: {},
      })

      expect(metadata).toEqual({
        title: 'ニュースが見つかりません | Crypto Media',
      })
    })

    it('CI環境ではデフォルトメタデータを返す', async () => {
      process.env.CI = 'true'

      const metadata = await generateMetadata({
        params: { slug: 'test' },
        searchParams: {},
      })

      expect(metadata).toEqual({
        title: 'メディアニュース | Crypto Media',
        description: '暗号資産・ブロックチェーンに関するニュースの詳細をご覧いただけます。',
      })
    })
  })
})