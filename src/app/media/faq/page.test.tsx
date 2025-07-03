import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import FAQPage, { generateMetadata } from './page'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import type { CorporatePage } from '@/lib/schema/corporate-page.schema'

// モックの設定
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/lib/microcms/corporate-pages', () => ({
  getCorporatePageBySlug: vi.fn(),
}))

describe('FAQPage', () => {
  const mockPage: CorporatePage = {
    id: '2',
    slug: 'faq',
    title: 'よくある質問',
    description: 'Crypto Mediaのサービスに関するよくある質問をまとめました',
    content: '<p>よくある質問と回答をご紹介します</p>',
    sections: [
      {
        title: '会員登録について',
        content: '<ul><li>Q: 会員登録は無料ですか？<br>A: はい、無料で登録できます。</li></ul>',
        type: 'list',
      },
      {
        title: '有料会員について',
        content: '<p>有料会員になると、すべての記事が読み放題になります。月額1,980円（税込）です。</p>',
        type: 'text',
      },
      {
        title: '料金プラン比較',
        content: '<table><tr><th>プラン</th><th>料金</th><th>特典</th></tr></table>',
        type: 'table',
      },
    ],
    metadata: {
      ogImage: {
        url: 'https://example.com/faq-og-image.jpg',
        width: 1200,
        height: 630,
      },
      keywords: ['FAQ', 'よくある質問', 'Crypto Media'],
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ページの表示', () => {
    it('正常にページが表示される', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

      const Page = await FAQPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('よくある質問')
      expect(screen.getByText('Crypto Mediaのサービスに関するよくある質問をまとめました')).toBeInTheDocument()
      expect(screen.getByText('よくある質問と回答をご紹介します')).toBeInTheDocument()
    })

    it('セクションが正しく表示される', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

      const Page = await FAQPage()
      render(Page)

      // 各セクションのタイトルが表示されている
      expect(screen.getByText('会員登録について')).toBeInTheDocument()
      expect(screen.getByText('有料会員について')).toBeInTheDocument()
      expect(screen.getByText('料金プラン比較')).toBeInTheDocument()

      // リスト形式のコンテンツ
      expect(screen.getByText(/Q: 会員登録は無料ですか？/)).toBeInTheDocument()
      expect(screen.getByText(/A: はい、無料で登録できます。/)).toBeInTheDocument()
      
      // テキスト形式のコンテンツ
      expect(screen.getByText('有料会員になると、すべての記事が読み放題になります。月額1,980円（税込）です。')).toBeInTheDocument()
    })

    it('descriptionがない場合でも正常に表示される', async () => {
      const pageWithoutDescription = { ...mockPage, description: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutDescription)

      const Page = await FAQPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('よくある質問')
      expect(screen.getByText('よくある質問と回答をご紹介します')).toBeInTheDocument()
    })

    it('sectionsがない場合でも正常に表示される', async () => {
      const pageWithoutSections = { ...mockPage, sections: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutSections)

      const Page = await FAQPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('よくある質問')
      expect(screen.getByText('よくある質問と回答をご紹介します')).toBeInTheDocument()
    })

    it('ページが見つからない場合は404エラーを表示', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)
      vi.mocked(notFound).mockImplementationOnce(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      await expect(FAQPage()).rejects.toThrow('NEXT_NOT_FOUND')

      expect(getCorporatePageBySlug).toHaveBeenCalledWith('faq')
      expect(notFound).toHaveBeenCalledTimes(1)
    })
  })

  describe('generateMetadata', () => {
    it('ページデータがある場合、正しいメタデータを生成する', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: 'よくある質問 | Crypto Media',
        description: 'Crypto Mediaのサービスに関するよくある質問をまとめました',
        keywords: ['FAQ', 'よくある質問', 'Crypto Media'],
        openGraph: {
          title: 'よくある質問 | Crypto Media',
          description: 'Crypto Mediaのサービスに関するよくある質問をまとめました',
          images: ['https://example.com/faq-og-image.jpg'],
        },
      })
    })

    it('ページデータがない場合、デフォルトのメタデータを生成する', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: 'よくある質問 | Crypto Media',
        description: 'Crypto Mediaに関するよくある質問と回答',
      })
    })

    it('descriptionがない場合、デフォルトの説明を使用する', async () => {
      const pageWithoutDescription = { ...mockPage, description: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutDescription)

      const metadata = await generateMetadata()

      expect(metadata.description).toBe('Crypto Mediaに関するよくある質問と回答')
      expect(metadata.openGraph?.description).toBe('Crypto Mediaに関するよくある質問と回答')
    })

    it('metadataがない場合でも正常に動作する', async () => {
      const pageWithoutMetadata = { ...mockPage, metadata: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutMetadata)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: 'よくある質問 | Crypto Media',
        description: 'Crypto Mediaのサービスに関するよくある質問をまとめました',
        keywords: undefined,
        openGraph: {
          title: 'よくある質問 | Crypto Media',
          description: 'Crypto Mediaのサービスに関するよくある質問をまとめました',
          images: undefined,
        },
      })
    })
  })
})