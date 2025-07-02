import { describe, it, expect, vi, beforeEach } from 'vitest'
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

vi.mock('@/components/corporate/CorporatePageContent', () => ({
  CorporatePageContent: ({ page }: { page: { content: string } }) => (
    <div>{page.content}</div>
  ),
}))

/**
 * プライバシーポリシーページのテスト
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
describe('PrivacyPolicyPage', () => {
  const mockPage = {
    id: 'privacy-policy-id',
    slug: 'privacy-policy',
    title: 'プライバシーポリシー',
    description: '当社のプライバシーポリシー',
    content: '<p>個人情報の取扱いについて</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the privacy policy page when data is available', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const Page = await PrivacyPolicyPage()
    render(Page)

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('privacy-policy')
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument()
    expect(
      screen.getByText('<p>個人情報の取扱いについて</p>')
    ).toBeInTheDocument()
  })

  it('should call notFound when page is not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(null)
    vi.mocked(notFound).mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(PrivacyPolicyPage()).rejects.toThrow('NEXT_NOT_FOUND')

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('privacy-policy')
    expect(notFound).toHaveBeenCalled()
  })

  it('適切なコンテナークラスが適用されている', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const Page = await PrivacyPolicyPage()
    const { container } = render(Page)

    const main = container.querySelector('main')
    expect(main).toHaveClass('min-h-screen')

    const contentWrapper = container.querySelector('.container')
    expect(contentWrapper).toHaveClass('container', 'mx-auto', 'px-4', 'py-16')
  })
})

describe('generateMetadata', () => {
  const mockPage = {
    id: 'privacy-policy-id',
    slug: 'privacy-policy',
    title: 'プライバシーポリシー',
    description: '株式会社クリプトメディアのプライバシーポリシーです',
    content: '<p>詳細</p>',
    metadata: {
      ogImage: {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
      keywords: ['プライバシーポリシー', '個人情報保護', 'クリプトメディア'],
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate metadata when page exists', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(mockPage)

    const metadata = await generateMetadata()

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('privacy-policy')
    expect(metadata).toMatchObject({
      title: 'プライバシーポリシー',
      description: '株式会社クリプトメディアのプライバシーポリシーです',
      keywords: 'プライバシーポリシー, 個人情報保護, クリプトメディア',
    })
  })

  it('should return empty metadata when page not found', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValueOnce(null)

    const metadata = await generateMetadata()

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('privacy-policy')
    expect(metadata).toEqual({})
  })
})
