import { vi, describe, it, expect, beforeEach } from 'vitest'
import { generateStaticPageMetadata } from './generateStaticPageMetadata'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { generatePageMetadata } from '@/lib/metadata/generateMetadata'
import { createMockCorporatePage } from '@/test/helpers/corporateStaticPage'

vi.mock('@/lib/microcms/corporate-pages')
vi.mock('@/lib/metadata/generateMetadata')

describe('generateStaticPageMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ページが存在する場合、メタデータを生成する', async () => {
    const mockPage = createMockCorporatePage({
      title: 'テストページ',
      description: 'テスト説明',
      metadata: {
        keywords: ['キーワード1', 'キーワード2'],
        ogImage: {
          url: 'https://example.com/image.jpg',
          width: 1200,
          height: 630,
        },
      },
    })

    const expectedMetadata = {
      title: 'テストページ | サイト名',
      description: 'テスト説明',
    }

    vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)
    vi.mocked(generatePageMetadata).mockReturnValue(expectedMetadata)

    const result = await generateStaticPageMetadata('test-page', '/test-page')

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('test-page')
    expect(generatePageMetadata).toHaveBeenCalledWith({
      title: 'テストページ',
      description: 'テスト説明',
      path: '/test-page',
      ogImage: 'https://example.com/image.jpg',
      keywords: ['キーワード1', 'キーワード2'],
    })
    expect(result).toEqual(expectedMetadata)
  })

  it('ページが存在しない場合、空のメタデータを返す', async () => {
    vi.mocked(getCorporatePageBySlug).mockResolvedValue(null)

    const result = await generateStaticPageMetadata(
      'non-existent',
      '/non-existent'
    )

    expect(getCorporatePageBySlug).toHaveBeenCalledWith('non-existent')
    expect(generatePageMetadata).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('descriptionが空の場合、空文字列を渡す', async () => {
    const mockPage = createMockCorporatePage({
      title: 'テストページ',
      description: undefined,
    })

    vi.mocked(getCorporatePageBySlug).mockResolvedValue(mockPage)
    vi.mocked(generatePageMetadata).mockReturnValue({})

    await generateStaticPageMetadata('test-page', '/test-page')

    expect(generatePageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '',
      })
    )
  })
})
