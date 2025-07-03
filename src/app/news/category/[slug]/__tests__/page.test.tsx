/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { notFound } from 'next/navigation'
import NewsCategoryPage, { generateMetadata } from '../page'
import { getCorporateNewsListByCategory } from '@/lib/microcms/corporate-news'
import { generatePageMetadata } from '@/lib/metadata/generateMetadata'
import type { CorporateNews } from '@/lib/schema'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('@/lib/microcms/corporate-news', () => ({
  getCorporateNewsListByCategory: vi.fn(),
}))

vi.mock('@/lib/metadata/generateMetadata', () => ({
  generatePageMetadata: vi.fn(),
}))

describe('NewsCategoryPage', () => {
  const mockNews: CorporateNews[] = [
    {
      id: '1',
      title: 'ニュース1',
      content: '内容1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      publishedAt: '2024-01-01T00:00:00Z',
      revisedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'ニュース2',
      content: '内容2',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      publishedAt: '2024-01-02T00:00:00Z',
      revisedAt: '2024-01-02T00:00:00Z',
    },
  ]

  const mockParams = Promise.resolve({ slug: 'press-release' })
  const mockSearchParams = Promise.resolve({ page: '1' })

  it('カテゴリ別ニュース一覧が正しく表示される', async () => {
    vi.mocked(getCorporateNewsListByCategory).mockResolvedValue({
      contents: mockNews,
      totalCount: 2,
      offset: 0,
      limit: 10,
    })

    const page = await NewsCategoryPage({
      params: mockParams,
      searchParams: mockSearchParams,
    })

    expect(getCorporateNewsListByCategory).toHaveBeenCalledWith('press-release', {
      limit: 10,
      offset: 0,
    })
    expect(page).toMatchSnapshot()
  })

  it('ニュースが0件の場合、最初のページではnotFoundを呼ぶ', async () => {
    vi.mocked(getCorporateNewsListByCategory).mockResolvedValue({
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 10,
    })

    await expect(
      NewsCategoryPage({
        params: mockParams,
        searchParams: mockSearchParams,
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
  })

  it('2ページ目以降でニュースが0件の場合は空のリストを表示', async () => {
    vi.mocked(getCorporateNewsListByCategory).mockResolvedValue({
      contents: [],
      totalCount: 20,
      offset: 20,
      limit: 10,
    })

    const page = await NewsCategoryPage({
      params: mockParams,
      searchParams: Promise.resolve({ page: '3' }),
    })

    expect(page).toMatchSnapshot()
  })

  it('ページネーションが正しく動作する', async () => {
    vi.mocked(getCorporateNewsListByCategory).mockResolvedValue({
      contents: mockNews,
      totalCount: 25,
      offset: 10,
      limit: 10,
    })

    const page = await NewsCategoryPage({
      params: mockParams,
      searchParams: Promise.resolve({ page: '2' }),
    })

    expect(getCorporateNewsListByCategory).toHaveBeenCalledWith('press-release', {
      limit: 10,
      offset: 10,
    })
    expect(page).toMatchSnapshot()
  })

  it('API呼び出しでエラーが発生した場合はnotFoundを呼ぶ', async () => {
    vi.mocked(getCorporateNewsListByCategory).mockRejectedValue(
      new Error('API Error')
    )

    await expect(
      NewsCategoryPage({
        params: mockParams,
        searchParams: mockSearchParams,
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
  })

  describe('generateMetadata', () => {
    it('適切なメタデータを生成する', async () => {
      const mockMetadata = {
        title: 'プレスリリースのニュース一覧 | 株式会社Example',
        description: 'プレスリリースに関する最新のニュースをご覧いただけます。',
      }
      vi.mocked(generatePageMetadata).mockReturnValue(mockMetadata)

      const metadata = await generateMetadata({
        params: mockParams,
        searchParams: mockSearchParams,
      })

      expect(generatePageMetadata).toHaveBeenCalledWith({
        title: 'プレスリリースのニュース一覧',
        description: 'プレスリリースに関する最新のニュースをご覧いただけます。',
        path: '/news/category/press-release',
      })
      expect(metadata).toEqual(mockMetadata)
    })

    it('未知のカテゴリの場合はslugをそのまま使用する', async () => {
      const unknownSlugParams = Promise.resolve({ slug: 'unknown-category' })

      await generateMetadata({
        params: unknownSlugParams,
        searchParams: mockSearchParams,
      })

      expect(generatePageMetadata).toHaveBeenCalledWith({
        title: 'unknown-categoryのニュース一覧',
        description: 'unknown-categoryに関する最新のニュースをご覧いただけます。',
        path: '/news/category/unknown-category',
      })
    })
  })
})