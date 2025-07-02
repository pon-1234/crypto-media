import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import TermsPage, { generateMetadata } from './page'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'

vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}))

vi.mock('@/lib/microcms/corporate-pages', () => ({
  getCorporatePageBySlug: vi.fn()
}))

vi.mock('@/components/corporate/CorporatePageContent', () => ({
  CorporatePageContent: ({ page }: { page: { content: string } }) => <div>{page.content}</div>
}))

/**
 * 利用規約ページのテスト
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
describe('TermsPage', () => {
  const mockPage = {
    id: 'terms-id',
    slug: 'terms',
    title: '利用規約',
    description: '当サービスの利用規約',
    content: '<p>利用規約の詳細</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the terms page when data is available', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const Page = await TermsPage()
    render(Page)

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('terms')
    expect(screen.getByText('利用規約')).toBeInTheDocument()
    expect(screen.getByText('<p>利用規約の詳細</p>')).toBeInTheDocument()
  })

  it('should call notFound when page is not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(null)
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(TermsPage()).rejects.toThrow('NEXT_NOT_FOUND')

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('terms')
    expect(notFound).toHaveBeenCalled()
  })

  it('適切なコンテナークラスが適用されている', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const Page = await TermsPage()
    const { container } = render(Page)

    const main = container.querySelector('main')
    expect(main).toHaveClass('min-h-screen')

    const contentWrapper = container.querySelector('.container')
    expect(contentWrapper).toHaveClass('container', 'mx-auto', 'px-4', 'py-16')
  })
})

describe('generateMetadata', () => {
  const mockPage = {
    id: 'terms-id',
    slug: 'terms',
    title: '利用規約',
    description: 'Crypto Mediaの利用規約について。サービスの利用条件などを記載しています。',
    content: '<p>詳細</p>',
    metadata: {
      ogImage: {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630
      },
      keywords: ['利用規約', '会員規約', '免責事項']
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate metadata when page exists', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const metadata = await generateMetadata()

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('terms')
    expect(metadata).toMatchObject({
      title: '利用規約',
      description: 'Crypto Mediaの利用規約について。サービスの利用条件などを記載しています。',
      keywords: '利用規約, 会員規約, 免責事項'
    })
  })

  it('should return empty metadata when page not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(null)

    const metadata = await generateMetadata()

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('terms')
    expect(metadata).toEqual({})
  })
})