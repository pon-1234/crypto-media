import { describe, it, expect } from 'vitest'
import {
  corporatePageSchema,
  corporatePageListSchema,
} from './corporate-page.schema'

describe('corporatePageSchema', () => {
  const validCorporatePage = {
    id: 'test-id',
    slug: 'about',
    title: '会社概要',
    description: '当社の事業内容と理念について',
    content: '<p>詳細なコンテンツ</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }

  it('should validate a valid corporate page', () => {
    const result = corporatePageSchema.safeParse(validCorporatePage)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validCorporatePage)
    }
  })

  it('should validate a corporate page with sections', () => {
    const pageWithSections = {
      ...validCorporatePage,
      sections: [
        {
          title: 'ビジョン',
          content: '私たちのビジョンは...',
          type: 'text',
        },
        {
          title: 'サービス一覧',
          content: '<ul><li>サービス1</li></ul>',
          type: 'list',
        },
      ],
    }
    const result = corporatePageSchema.safeParse(pageWithSections)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sections).toHaveLength(2)
      expect(result.data.sections?.[0].type).toBe('text')
      expect(result.data.sections?.[1].type).toBe('list')
    }
  })

  it('should validate a corporate page with metadata', () => {
    const pageWithMetadata = {
      ...validCorporatePage,
      metadata: {
        ogImage: {
          url: 'https://images.microcms-assets.io/test.jpg',
          width: 1200,
          height: 630,
        },
        keywords: ['暗号資産', 'ブロックチェーン', '会社概要'],
      },
    }
    const result = corporatePageSchema.safeParse(pageWithMetadata)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata?.ogImage?.url).toBe(
        'https://images.microcms-assets.io/test.jpg'
      )
      expect(result.data.metadata?.keywords).toHaveLength(3)
    }
  })

  it('should validate a published corporate page', () => {
    const publishedPage = {
      ...validCorporatePage,
      publishedAt: '2025-01-01T00:00:00.000Z',
      revisedAt: '2025-01-01T00:00:00.000Z',
    }
    const result = corporatePageSchema.safeParse(publishedPage)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.publishedAt).toBe('2025-01-01T00:00:00.000Z')
      expect(result.data.revisedAt).toBe('2025-01-01T00:00:00.000Z')
    }
  })

  it('should reject invalid section type', () => {
    const invalidPage = {
      ...validCorporatePage,
      sections: [
        {
          title: '無効なセクション',
          content: 'コンテンツ',
          type: 'invalid',
        },
      ],
    }
    const result = corporatePageSchema.safeParse(invalidPage)
    expect(result.success).toBe(false)
  })

  it('should reject missing required fields', () => {
    const invalidPage = {
      id: 'test-id',
      slug: 'about',
      // missing title, description, content, createdAt, updatedAt
    }
    const result = corporatePageSchema.safeParse(invalidPage)
    expect(result.success).toBe(false)
  })
})

describe('corporatePageListSchema', () => {
  it('should validate a valid list response', () => {
    const validList = {
      contents: [
        {
          id: 'test-id-1',
          slug: 'about',
          title: '会社概要',
          description: '当社について',
          content: '<p>コンテンツ</p>',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'test-id-2',
          slug: 'service',
          title: 'サービス',
          description: 'サービス内容',
          content: '<p>サービス詳細</p>',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      totalCount: 2,
      offset: 0,
      limit: 10,
    }
    const result = corporatePageListSchema.safeParse(validList)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.contents).toHaveLength(2)
      expect(result.data.totalCount).toBe(2)
      expect(result.data.offset).toBe(0)
      expect(result.data.limit).toBe(10)
    }
  })

  it('should validate an empty list', () => {
    const emptyList = {
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 10,
    }
    const result = corporatePageListSchema.safeParse(emptyList)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.contents).toHaveLength(0)
      expect(result.data.totalCount).toBe(0)
    }
  })

  it('should reject missing pagination fields', () => {
    const invalidList = {
      contents: [],
      totalCount: 0,
      // missing offset and limit
    }
    const result = corporatePageListSchema.safeParse(invalidList)
    expect(result.success).toBe(false)
  })
})
