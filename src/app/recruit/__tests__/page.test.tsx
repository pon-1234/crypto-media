/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { notFound } from 'next/navigation'
import RecruitPage, { generateMetadata } from '../page'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { generatePageMetadata } from '@/lib/metadata/generateMetadata'
import type { CorporatePage } from '@/lib/schema/corporate-page.schema'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('@/lib/microcms/corporate-pages', () => ({
  getCorporatePageBySlug: vi.fn(),
}))

vi.mock('@/lib/metadata/generateMetadata', () => ({
  generatePageMetadata: vi.fn(),
}))

vi.mock('@/components/corporate/CorporatePageContent', () => ({
  CorporatePageContent: vi.fn(({ page }) => (
    <div data-testid="corporate-page-content">{page.content}</div>
  )),
}))

describe('RecruitPage', () => {
  const mockPage: CorporatePage = {
    id: '1',
    slug: 'recruit',
    title: '採用情報',
    description: '当社の採用情報をご紹介します',
    content: '<p>採用情報の内容</p>',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    publishedAt: '2024-01-01T00:00:00Z',
    revisedAt: '2024-01-01T00:00:00Z',
    metadata: {
      ogImage: { url: 'https://example.com/og-image.jpg', width: 1200, height: 630 },
      keywords: ['採用', 'キャリア'],
    },
  }

  it('採用情報ページが正しく表示される', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

    const page = await RecruitPage()

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('recruit')
    expect(page).toMatchSnapshot()
  })

  it('ページが見つからない場合はnotFoundを呼ぶ', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

    await expect(RecruitPage()).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  describe('generateMetadata', () => {
    it('ページが存在する場合、適切なメタデータを生成する', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)
      const mockMetadata = {
        title: '採用情報 | 株式会社Example',
        description: '当社の採用情報をご紹介します',
      }
      vi.mocked(generatePageMetadata).mockReturnValue(mockMetadata)

      const metadata = await generateMetadata()

      expect(getCorporatePageBySlug).toHaveBeenCalledWith('recruit')
      expect(generatePageMetadata).toHaveBeenCalledWith({
        title: '採用情報',
        description: '当社の採用情報をご紹介します',
        path: '/recruit',
        ogImage: 'https://example.com/og-image.jpg',
        keywords: ['採用', 'キャリア'],
      })
      expect(metadata).toEqual(mockMetadata)
    })

    it('ページが見つからない場合は空のメタデータを返す', async () => {
      vi.clearAllMocks() // モックをクリア
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({})
      expect(generatePageMetadata).not.toHaveBeenCalled()
    })

    it('descriptionがない場合は空文字を渡す', async () => {
      const pageWithoutDescription = { ...mockPage, description: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutDescription)

      await generateMetadata()

      expect(generatePageMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
        })
      )
    })

    it('メタデータがない場合はundefinedを渡す', async () => {
      const pageWithoutMetadata = { ...mockPage, metadata: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutMetadata)

      await generateMetadata()

      expect(generatePageMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          ogImage: undefined,
          keywords: undefined,
        })
      )
    })
  })
})