import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import AboutPage, { generateMetadata } from './page'
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
 * 会社概要ページのテスト
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
describe('AboutPage', () => {
  const mockPage = {
    id: 'about-id',
    slug: 'about',
    title: '会社概要',
    description: '当社の会社概要',
    content: '<p>会社の詳細情報</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the about page when data is available', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const Page = await AboutPage()
    render(Page)

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('about')
    expect(screen.getByText('会社概要')).toBeInTheDocument()
    expect(screen.getByText('<p>会社の詳細情報</p>')).toBeInTheDocument()
  })

  it('should call notFound when page is not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(null)
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(AboutPage()).rejects.toThrow('NEXT_NOT_FOUND')

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('about')
    expect(notFound).toHaveBeenCalled()
  })

  it('適切なコンテナークラスが適用されている', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const Page = await AboutPage()
    const { container } = render(Page)

    const main = container.querySelector('main')
    expect(main).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')

    const contentWrapper = container.querySelector('.max-w-4xl')
    expect(contentWrapper).toBeInTheDocument()
  })
})

describe('generateMetadata', () => {
  const mockPage = {
    id: 'about-id',
    slug: 'about',
    title: '会社概要',
    description: '株式会社クリプトメディアの会社概要です',
    content: '<p>詳細</p>',
    metadata: {
      ogImage: {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630
      },
      keywords: ['暗号資産', 'ブロックチェーン', '会社概要']
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

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('about')
    expect(metadata).toMatchObject({
      title: '会社概要',
      description: '株式会社クリプトメディアの会社概要です',
      keywords: '暗号資産, ブロックチェーン, 会社概要'
    })
  })

  it('should return empty metadata when page not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(null)

    const metadata = await generateMetadata()

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('about')
    expect(metadata).toEqual({})
  })
})
