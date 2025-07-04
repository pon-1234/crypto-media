import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import GlossaryPage, { generateMetadata } from './page'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import type { CorporatePage } from '@/lib/schema/corporate-page.schema'

// モックの設定
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/lib/microcms/corporate-pages', () => ({
  getCorporatePageBySlug: vi.fn(),
}))

describe('GlossaryPage', () => {
  const mockPage: CorporatePage = {
    id: '1',
    slug: 'glossary',
    title: '用語集',
    description: '暗号資産・ブロックチェーンの専門用語を解説します',
    content: '<p>ここに用語集の内容が表示されます</p>',
    sections: [
      {
        title: 'A-Z',
        content: '<ul><li>API: Application Programming Interface</li></ul>',
        type: 'list',
      },
      {
        title: 'あ行',
        content: '<p>暗号資産（あんごうしさん）: デジタル通貨の一種</p>',
        type: 'text',
      },
      {
        title: '用語一覧表',
        content: '<table><tr><th>用語</th><th>説明</th></tr></table>',
        type: 'table',
      },
    ],
    metadata: {
      ogImage: {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
      keywords: ['暗号資産', 'ブロックチェーン', '用語集'],
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

      const Page = await GlossaryPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '用語集'
      )
      expect(
        screen.getByText('暗号資産・ブロックチェーンの専門用語を解説します')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ここに用語集の内容が表示されます')
      ).toBeInTheDocument()
    })

    it('セクションが正しく表示される', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

      const Page = await GlossaryPage()
      render(Page)

      // 各セクションのタイトルが表示されている
      expect(screen.getByText('A-Z')).toBeInTheDocument()
      expect(screen.getByText('あ行')).toBeInTheDocument()
      expect(screen.getByText('用語一覧表')).toBeInTheDocument()

      // リスト形式のコンテンツ
      expect(
        screen.getByText('API: Application Programming Interface')
      ).toBeInTheDocument()

      // テキスト形式のコンテンツ
      expect(
        screen.getByText('暗号資産（あんごうしさん）: デジタル通貨の一種')
      ).toBeInTheDocument()
    })

    it('descriptionがない場合でも正常に表示される', async () => {
      const pageWithoutDescription = { ...mockPage, description: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(
        pageWithoutDescription
      )

      const Page = await GlossaryPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '用語集'
      )
      expect(
        screen.getByText('ここに用語集の内容が表示されます')
      ).toBeInTheDocument()
    })

    it('sectionsがない場合でも正常に表示される', async () => {
      const pageWithoutSections = { ...mockPage, sections: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutSections)

      const Page = await GlossaryPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '用語集'
      )
      expect(
        screen.getByText('ここに用語集の内容が表示されます')
      ).toBeInTheDocument()
    })

    it('ページが見つからない場合は404エラーを表示', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)
      vi.mocked(notFound).mockImplementationOnce(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      await expect(GlossaryPage()).rejects.toThrow('NEXT_NOT_FOUND')

      expect(getCorporatePageBySlug).toHaveBeenCalledWith('glossary')
      expect(notFound).toHaveBeenCalledTimes(1)
    })
  })

  describe('generateMetadata', () => {
    it('ページデータがある場合、正しいメタデータを生成する', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: '用語集 | Crypto Media',
        description: '暗号資産・ブロックチェーンの専門用語を解説します',
        keywords: ['暗号資産', 'ブロックチェーン', '用語集'],
        openGraph: {
          title: '用語集 | Crypto Media',
          description: '暗号資産・ブロックチェーンの専門用語を解説します',
          images: ['https://example.com/og-image.jpg'],
        },
      })
    })

    it('ページデータがない場合、デフォルトのメタデータを生成する', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: '用語集 | Crypto Media',
        description: '暗号資産・ブロックチェーンに関する用語集',
      })
    })

    it('descriptionがない場合、デフォルトの説明を使用する', async () => {
      const pageWithoutDescription = { ...mockPage, description: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(
        pageWithoutDescription
      )

      const metadata = await generateMetadata()

      expect(metadata.description).toBe(
        '暗号資産・ブロックチェーンに関する用語集'
      )
      expect(metadata.openGraph?.description).toBe(
        '暗号資産・ブロックチェーンに関する用語集'
      )
    })

    it('metadataがない場合でも正常に動作する', async () => {
      const pageWithoutMetadata = { ...mockPage, metadata: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutMetadata)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: '用語集 | Crypto Media',
        description: '暗号資産・ブロックチェーンの専門用語を解説します',
        keywords: undefined,
        openGraph: {
          title: '用語集 | Crypto Media',
          description: '暗号資産・ブロックチェーンの専門用語を解説します',
          images: undefined,
        },
      })
    })
  })
})
