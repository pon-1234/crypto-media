import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import PrivacyPolicyPage, { generateMetadata } from './page'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/lib/microcms/corporate-pages', () => ({
  getCorporatePageBySlug: vi.fn(),
}))

vi.mock('@/components/corporate/CorporateStaticPage', () => ({
  CorporateStaticPage: ({ page }: { page: { title: string } | null }) => {
    if (!page) {
      return <div>Page not found</div>
    }
    return (
      <div>
        <h1>{page.title}</h1>
      </div>
    )
  },
}))

vi.mock('@/lib/corporate/generateStaticPageMetadata', () => ({
  generateStaticPageMetadata: vi.fn().mockResolvedValue({
    title: 'プライバシーポリシー | 暗号資産メディア',
    description: '当サイトのプライバシーポリシーです。',
  }),
}))

describe('PrivacyPolicyPage', () => {
  const mockPage = {
    id: 'privacy-policy-id',
    slug: 'privacy-policy',
    title: 'プライバシーポリシー',
    description: '当サイトのプライバシーポリシーです。',
    content: '<p>詳細情報</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the page when data is available', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

    const Page = await PrivacyPolicyPage()
    render(Page)

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('privacy-policy')
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument()
  })

  it('should render not found message when page is not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

    const Page = await PrivacyPolicyPage()
    render(Page)

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('privacy-policy')
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })
})

describe('generateMetadata', () => {
  it('generateStaticPageMetadataに正しいパラメータを渡す', async () => {
    const { generateStaticPageMetadata } = await import('@/lib/corporate/generateStaticPageMetadata')
    
    const metadata = await generateMetadata()

    expect(generateStaticPageMetadata).toHaveBeenCalledWith('privacy-policy', '/privacy-policy')
    expect(metadata).toEqual({
      title: 'プライバシーポリシー | 暗号資産メディア',
      description: '当サイトのプライバシーポリシーです。',
    })
  })
})