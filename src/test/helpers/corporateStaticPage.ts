import { vi } from 'vitest'
import type { CorporatePage } from '@/lib/schema/corporate-page.schema'

/**
 * コーポレート静的ページのモックデータを生成
 */
export function createMockCorporatePage(
  overrides: Partial<CorporatePage> = {}
): CorporatePage {
  return {
    id: overrides.id || 'test-page-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    revisedAt: '2024-01-01T00:00:00.000Z',
    title: 'テストページ',
    slug: 'test-page',
    content: '<p>テストコンテンツ</p>',
    metadata: {
      keywords: ['テスト', 'キーワード'],
    },
    ...overrides,
  }
}

/**
 * コーポレート静的ページテスト用のモック設定
 */
export function setupCorporateStaticPageMocks() {
  vi.mock('next/navigation', () => ({
    notFound: vi.fn(() => {
      throw new Error('notFound')
    }),
  }))

  vi.mock('@/lib/microcms/corporate-pages', () => ({
    getCorporatePageBySlug: vi.fn(),
  }))

  vi.mock('@/lib/corporate/generateStaticPageMetadata', () => ({
    generateStaticPageMetadata: vi.fn(),
  }))

  vi.mock('@/components/corporate/CorporateStaticPage', () => ({
    CorporateStaticPage: vi.fn(),
  }))
}
