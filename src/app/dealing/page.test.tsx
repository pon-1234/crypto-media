import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import DealingPage, { generateMetadata } from './page'
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
    title: '特定商取引法に基づく表記 | 暗号資産メディア',
    description: '当サイトの特定商取引法に基づく表記です。',
  }),
}))

describe('DealingPage', () => {
  const mockPage = {
    id: 'dealing-id',
    slug: 'dealing',
    title: '特定商取引法に基づく表記',
    description: '当サイトの特定商取引法に基づく表記です。',
    content: '<p>詳細情報</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the page when data is available', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

    const Page = await DealingPage()
    render(Page)

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('dealing')
    expect(screen.getByText('特定商取引法に基づく表記')).toBeInTheDocument()
  })

  it('should render not found message when page is not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

    const Page = await DealingPage()
    render(Page)

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('dealing')
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })
})

describe('generateMetadata', () => {
  it('generateStaticPageMetadataに正しいパラメータを渡す', async () => {
    const { generateStaticPageMetadata } = await import('@/lib/corporate/generateStaticPageMetadata')
    
    const metadata = await generateMetadata()

    expect(generateStaticPageMetadata).toHaveBeenCalledWith('dealing', '/dealing')
    expect(metadata).toEqual({
      title: '特定商取引法に基づく表記 | 暗号資産メディア',
      description: '当サイトの特定商取引法に基づく表記です。',
    })
  })
})