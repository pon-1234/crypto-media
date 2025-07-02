import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import NewsDetailPage, { generateMetadata, generateStaticParams } from '../page'
import * as microCMS from '@/lib/microcms'
import { formatDate } from '@/lib/utils/date'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('next/headers', () => ({
  draftMode: vi.fn(),
}))

// Mock microCMS functions
vi.mock('@/lib/microcms', () => ({
  getCorporateNewsDetail: vi.fn(),
  getAllCorporateNewsIds: vi.fn(),
}))

// Mock date utility
vi.mock('@/lib/utils/date', () => ({
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString('ja-JP')),
}))

// Store original CI env
const originalCI = process.env.CI

describe('NewsDetailPage', () => {
  const mockNews = {
    id: 'news1',
    title: '新サービスリリースのお知らせ',
    content: '<p>新サービスをリリースしました。</p>',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-02T00:00:00.000Z',
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    // Disable CI mode for tests
    process.env.CI = undefined

    const { draftMode } = await import('next/headers')
    vi.mocked(draftMode).mockReturnValue({
      isEnabled: false,
      enable: vi.fn(),
      disable: vi.fn(),
    })
  })

  afterEach(() => {
    // Restore original CI env
    process.env.CI = originalCI
  })

  describe('generateStaticParams', () => {
    it('returns all news IDs', async () => {
      const mockIds = ['news1', 'news2', 'news3']
      vi.mocked(microCMS.getAllCorporateNewsIds).mockResolvedValue(mockIds)

      const params = await generateStaticParams()

      expect(params).toEqual([
        { id: 'news1' },
        { id: 'news2' },
        { id: 'news3' },
      ])
    })

    it('returns empty array in CI environment', async () => {
      process.env.CI = 'true'

      const params = await generateStaticParams()

      expect(params).toEqual([])
      expect(microCMS.getAllCorporateNewsIds).not.toHaveBeenCalled()
    })
  })

  describe('generateMetadata', () => {
    it('generates correct metadata for existing news', async () => {
      vi.mocked(microCMS.getCorporateNewsDetail).mockResolvedValue(mockNews)

      const metadata = await generateMetadata({
        params: { id: 'news1' },
        searchParams: {},
      })

      expect(metadata.title).toBe(
        '新サービスリリースのお知らせ | お知らせ | 株式会社Example'
      )
      expect(metadata.description).toBe(
        '新サービスリリースのお知らせの詳細をご覧いただけます。'
      )
      expect(metadata.openGraph?.title).toBe('新サービスリリースのお知らせ')
      // @ts-expect-error type is a valid property
      expect(metadata.openGraph?.type).toBe('article')
      // @ts-expect-error publishedTime is a valid property
      expect(metadata.openGraph?.publishedTime).toBe('2024-01-01T00:00:00.000Z')
    })

    it('returns default metadata on error', async () => {
      vi.mocked(microCMS.getCorporateNewsDetail).mockRejectedValue(
        new Error('API Error')
      )

      const metadata = await generateMetadata({
        params: { id: 'invalid' },
        searchParams: {},
      })

      expect(metadata.title).toBe('お知らせ | 株式会社Example')
    })

    it('returns default metadata in CI environment', async () => {
      process.env.CI = 'true'

      const metadata = await generateMetadata({
        params: { id: 'news1' },
        searchParams: {},
      })

      expect(metadata.title).toBe('お知らせ | 株式会社Example')
      expect(metadata.description).toBe(
        'コーポレートお知らせの詳細をご覧いただけます。'
      )
      expect(microCMS.getCorporateNewsDetail).not.toHaveBeenCalled()
    })
  })

  describe('Page component', () => {
    it('renders news detail page', async () => {
      vi.mocked(microCMS.getCorporateNewsDetail).mockResolvedValue(mockNews)
      vi.mocked(formatDate).mockImplementation((date) =>
        new Date(date).toLocaleDateString('ja-JP')
      )

      const Component = await NewsDetailPage({
        params: { id: 'news1' },
        searchParams: {},
      })
      render(Component)

      // Check title - use more specific query to avoid duplicates
      expect(
        screen.getByRole('heading', { name: '新サービスリリースのお知らせ' })
      ).toBeInTheDocument()

      // Check date
      expect(formatDate).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z')

      // Check breadcrumbs
      expect(screen.getByText('ホーム')).toBeInTheDocument()
      expect(screen.getByText('お知らせ')).toBeInTheDocument()

      // Check back link
      expect(screen.getByText('お知らせ一覧に戻る')).toBeInTheDocument()
    })

    it('calls notFound for non-existent news', async () => {
      vi.mocked(microCMS.getCorporateNewsDetail).mockRejectedValue(
        new Error('Not found')
      )

      const mockNotFound = vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      await expect(
        NewsDetailPage({
          params: { id: 'non-existent' },
          searchParams: {},
        })
      ).rejects.toThrow('NEXT_NOT_FOUND')

      expect(mockNotFound).toHaveBeenCalled()
    })

    it('renders dummy page in CI environment', async () => {
      process.env.CI = 'true'

      const Component = await NewsDetailPage({
        params: { id: 'news1' },
        searchParams: {},
      })
      render(Component)

      expect(screen.getByText('お知らせ詳細')).toBeInTheDocument()
      expect(
        screen.getByText('CI環境でのビルド用ダミーページです。')
      ).toBeInTheDocument()
      expect(microCMS.getCorporateNewsDetail).not.toHaveBeenCalled()
    })

    it('renders exit preview link in draft mode', async () => {
      const { draftMode } = await import('next/headers')
      vi.mocked(draftMode).mockReturnValue({
        isEnabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      })
      vi.mocked(microCMS.getCorporateNewsDetail).mockResolvedValue(mockNews)

      const Component = await NewsDetailPage({
        params: { id: 'news1' },
        searchParams: {},
      })
      render(Component)

      const exitPreviewLink = screen.getByText('プレビューモードを終了')
      expect(exitPreviewLink).toBeInTheDocument()
      expect(exitPreviewLink).toHaveAttribute(
        'href',
        '/api/exit-preview?redirect=/news/news1'
      )
    })
  })
})
