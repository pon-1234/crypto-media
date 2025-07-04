import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import EditorialPolicyPage, { generateMetadata } from './page'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import type { CorporatePage } from '@/lib/schema/corporate-page.schema'

// モックの設定
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('@/lib/microcms/corporate-pages', () => ({
  getCorporatePageBySlug: vi.fn(),
}))

describe('EditorialPolicyPage', () => {
  const mockPage: CorporatePage = {
    id: '3',
    slug: 'editorial-policy',
    title: '編集方針',
    description: 'Crypto Mediaは信頼性の高い情報提供を目指しています',
    content: '<p>私たちの編集方針をご説明します</p>',
    sections: [
      {
        title: '基本方針',
        content:
          '<ul><li>正確性: 事実確認を徹底します</li><li>中立性: 偏りのない報道を心がけます</li></ul>',
        type: 'list',
      },
      {
        title: '記事作成プロセス',
        content: '<p>すべての記事は、専門家による監修を受けています。</p>',
        type: 'text',
      },
      {
        title: '編集体制',
        content:
          '<table><tr><th>役割</th><th>責任</th></tr><tr><td>編集長</td><td>最終確認</td></tr></table>',
        type: 'table',
      },
    ],
    metadata: {
      ogImage: {
        url: 'https://example.com/editorial-og-image.jpg',
        width: 1200,
        height: 630,
      },
      keywords: ['編集方針', 'ガイドライン', 'Crypto Media'],
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

      const Page = await EditorialPolicyPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '編集方針'
      )
      expect(
        screen.getByText('Crypto Mediaは信頼性の高い情報提供を目指しています')
      ).toBeInTheDocument()
      expect(
        screen.getByText('私たちの編集方針をご説明します')
      ).toBeInTheDocument()
    })

    it('セクションが正しく表示される', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

      const Page = await EditorialPolicyPage()
      render(Page)

      // 各セクションのタイトルが表示されている
      expect(screen.getByText('基本方針')).toBeInTheDocument()
      expect(screen.getByText('記事作成プロセス')).toBeInTheDocument()
      expect(screen.getByText('編集体制')).toBeInTheDocument()

      // リスト形式のコンテンツ
      expect(
        screen.getByText('正確性: 事実確認を徹底します')
      ).toBeInTheDocument()
      expect(
        screen.getByText('中立性: 偏りのない報道を心がけます')
      ).toBeInTheDocument()

      // テキスト形式のコンテンツ
      expect(
        screen.getByText('すべての記事は、専門家による監修を受けています。')
      ).toBeInTheDocument()

      // テーブル形式のコンテンツ
      expect(screen.getByText('編集長')).toBeInTheDocument()
      expect(screen.getByText('最終確認')).toBeInTheDocument()
    })

    it('descriptionがない場合でも正常に表示される', async () => {
      const pageWithoutDescription = { ...mockPage, description: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(
        pageWithoutDescription
      )

      const Page = await EditorialPolicyPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '編集方針'
      )
      expect(
        screen.getByText('私たちの編集方針をご説明します')
      ).toBeInTheDocument()
    })

    it('sectionsがない場合でも正常に表示される', async () => {
      const pageWithoutSections = { ...mockPage, sections: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutSections)

      const Page = await EditorialPolicyPage()
      render(Page)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '編集方針'
      )
      expect(
        screen.getByText('私たちの編集方針をご説明します')
      ).toBeInTheDocument()
    })

    it('ページが見つからない場合は404エラーを表示', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)
      vi.mocked(notFound).mockImplementationOnce(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      await expect(EditorialPolicyPage()).rejects.toThrow('NEXT_NOT_FOUND')

      expect(getCorporatePageBySlug).toHaveBeenCalledWith('editorial-policy')
      expect(notFound).toHaveBeenCalledTimes(1)
    })
  })

  describe('generateMetadata', () => {
    it('ページデータがある場合、正しいメタデータを生成する', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: '編集方針 | Crypto Media',
        description: 'Crypto Mediaは信頼性の高い情報提供を目指しています',
        keywords: ['編集方針', 'ガイドライン', 'Crypto Media'],
        openGraph: {
          title: '編集方針 | Crypto Media',
          description: 'Crypto Mediaは信頼性の高い情報提供を目指しています',
          images: ['https://example.com/editorial-og-image.jpg'],
        },
      })
    })

    it('ページデータがない場合、デフォルトのメタデータを生成する', async () => {
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: '編集方針 | Crypto Media',
        description: 'Crypto Mediaの編集方針と記事作成ガイドライン',
      })
    })

    it('descriptionがない場合、デフォルトの説明を使用する', async () => {
      const pageWithoutDescription = { ...mockPage, description: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(
        pageWithoutDescription
      )

      const metadata = await generateMetadata()

      expect(metadata.description).toBe(
        'Crypto Mediaの編集方針と記事作成ガイドライン'
      )
      expect(metadata.openGraph?.description).toBe(
        'Crypto Mediaの編集方針と記事作成ガイドライン'
      )
    })

    it('metadataがない場合でも正常に動作する', async () => {
      const pageWithoutMetadata = { ...mockPage, metadata: undefined }
      vi.mocked(getCorporatePageBySlug).mockResolvedValue(pageWithoutMetadata)

      const metadata = await generateMetadata()

      expect(metadata).toEqual({
        title: '編集方針 | Crypto Media',
        description: 'Crypto Mediaは信頼性の高い情報提供を目指しています',
        keywords: undefined,
        openGraph: {
          title: '編集方針 | Crypto Media',
          description: 'Crypto Mediaは信頼性の高い情報提供を目指しています',
          images: undefined,
        },
      })
    })
  })
})
