/**
 * microCMS Zodスキーマのテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { describe, it, expect } from 'vitest'
import {
  microCMSBaseSchema,
  microCMSImageSchema,
  corporateNewsSchema,
  expertSchema,
  categorySchema,
  tagSchema,
  featureSchema,
  mediaArticleSchema,
  siteSettingsSchema,
  pageCorporateSchema,
  createListResponseSchema,
  type MicroCMSBase,
  type MicroCMSImage,
  type CorporateNews,
  type Expert,
  type Category,
  type Tag,
  type Feature,
  type MediaArticle,
  type SiteSettings,
  type PageCorporate,
} from '@/lib/schema'

describe('microCMS Schemas', () => {
  describe('microCMSBaseSchema', () => {
    it('必須フィールドを持つ有効なデータをパースできる', () => {
      const validData = {
        id: 'test-id',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      const result = microCMSBaseSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('オプションフィールドを含むデータをパースできる', () => {
      const validData = {
        id: 'test-id',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        publishedAt: '2024-01-01T00:00:00.000Z',
        revisedAt: '2024-01-01T00:00:00.000Z',
      }
      const result = microCMSBaseSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('必須フィールドが欠けている場合はエラーになる', () => {
      const invalidData = {
        id: 'test-id',
        createdAt: '2024-01-01T00:00:00.000Z',
        // updatedAt is missing
      }
      expect(() => microCMSBaseSchema.parse(invalidData)).toThrow()
    })
  })

  describe('microCMSImageSchema', () => {
    it('有効な画像データをパースできる', () => {
      const validData = {
        url: 'https://images.microcms-assets.io/test.jpg',
        height: 1080,
        width: 1920,
      }
      const result = microCMSImageSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('URLが無効な場合はエラーになる', () => {
      const invalidData = {
        url: 'not-a-valid-url',
        height: 1080,
        width: 1920,
      }
      expect(() => microCMSImageSchema.parse(invalidData)).toThrow()
    })
  })

  describe('corporateNewsSchema', () => {
    it('有効なコーポレートニュースデータをパースできる', () => {
      const validData = {
        id: 'news-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'テストニュース',
        content: 'ニュースの内容',
      }
      const result = corporateNewsSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('タイトルが空の場合はエラーになる', () => {
      const invalidData = {
        id: 'news-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: '',
        content: 'ニュースの内容',
      }
      expect(() => corporateNewsSchema.parse(invalidData)).toThrow()
    })
  })

  describe('expertSchema', () => {
    it('有効な執筆者データをパースできる', () => {
      const validData = {
        id: 'expert-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        name: 'テスト執筆者',
        slug: 'test-author',
        role: ['執筆者'],
        profile: 'プロフィール情報',
      }
      const result = expertSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('複数の役割を持つ執筆者データをパースできる', () => {
      const validData = {
        id: 'expert-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        name: 'テスト執筆者',
        slug: 'test-author',
        role: ['執筆者', '監修者'],
        profile: 'プロフィール情報',
        avatar: {
          url: 'https://images.microcms-assets.io/avatar.jpg',
          height: 200,
          width: 200,
        },
      }
      const result = expertSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('無効な役割の場合はエラーになる', () => {
      const invalidData = {
        id: 'expert-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        name: 'テスト執筆者',
        slug: 'test-author',
        role: ['無効な役割'],
        profile: 'プロフィール情報',
      }
      expect(() => expertSchema.parse(invalidData)).toThrow()
    })
  })

  describe('categorySchema', () => {
    it('有効なカテゴリデータをパースできる', () => {
      const validData = {
        id: 'cat-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        name: 'テストカテゴリ',
        slug: 'test-category',
      }
      const result = categorySchema.parse(validData)
      expect(result).toEqual(validData)
    })
  })

  describe('tagSchema', () => {
    it('有効なタグデータをパースできる', () => {
      const validData = {
        id: 'tag-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        name: 'テストタグ',
        slug: 'test-tag',
      }
      const result = tagSchema.parse(validData)
      expect(result).toEqual(validData)
    })
  })

  describe('featureSchema', () => {
    it('有効な特集データをパースできる', () => {
      const validData = {
        id: 'feature-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        name: 'テスト特集',
        slug: 'test-feature',
        description: '特集の説明',
      }
      const result = featureSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('画像付きの特集データをパースできる', () => {
      const validData = {
        id: 'feature-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        name: 'テスト特集',
        slug: 'test-feature',
        description: '特集の説明',
        heroImage: {
          url: 'https://images.microcms-assets.io/hero.jpg',
          height: 720,
          width: 1280,
        },
      }
      const result = featureSchema.parse(validData)
      expect(result).toEqual(validData)
    })
  })

  describe('mediaArticleSchema', () => {
    it('有効な記事データ（最小構成）をパースできる', () => {
      const validData = {
        id: 'article-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'テスト記事',
        slug: 'test-article',
        type: 'article',
        membershipLevel: 'public',
        content: '記事の内容',
        heroImage: {
          url: 'https://images.microcms-assets.io/hero.jpg',
          height: 720,
          width: 1280,
        },
      }
      const result = mediaArticleSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('有効な記事データ（全フィールド）をパースできる', () => {
      const validData = {
        id: 'article-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        publishedAt: '2024-01-01T00:00:00.000Z',
        title: 'テスト記事',
        slug: 'test-article',
        type: 'survey_report',
        membershipLevel: 'paid',
        content: '記事の内容',
        heroImage: {
          url: 'https://images.microcms-assets.io/hero.jpg',
          height: 720,
          width: 1280,
        },
        category: {
          id: 'cat-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          name: 'カテゴリ',
          slug: 'category',
        },
        tags: [
          {
            id: 'tag-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            name: 'タグ1',
            slug: 'tag-1',
          },
        ],
        author: {
          id: 'expert-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          name: '執筆者',
          slug: 'author',
          role: ['執筆者'],
          profile: 'プロフィール',
        },
        supervisor: {
          id: 'expert-2',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          name: '監修者',
          slug: 'supervisor',
          role: ['監修者'],
          profile: 'プロフィール',
        },
        features: [
          {
            id: 'feature-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            name: '特集',
            slug: 'feature',
            description: '説明',
          },
        ],
        previewContent: 'プレビュー内容',
        paywallCTA: 'カスタムCTA',
      }
      const result = mediaArticleSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('無効な記事タイプの場合はエラーになる', () => {
      const invalidData = {
        id: 'article-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'テスト記事',
        slug: 'test-article',
        type: 'invalid-type',
        membershipLevel: 'public',
        content: '記事の内容',
        heroImage: {
          url: 'https://images.microcms-assets.io/hero.jpg',
          height: 720,
          width: 1280,
        },
      }
      expect(() => mediaArticleSchema.parse(invalidData)).toThrow()
    })

    it('無効な会員レベルの場合はエラーになる', () => {
      const invalidData = {
        id: 'article-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'テスト記事',
        slug: 'test-article',
        type: 'article',
        membershipLevel: 'invalid-level',
        content: '記事の内容',
        heroImage: {
          url: 'https://images.microcms-assets.io/hero.jpg',
          height: 720,
          width: 1280,
        },
      }
      expect(() => mediaArticleSchema.parse(invalidData)).toThrow()
    })
  })

  describe('siteSettingsSchema', () => {
    it('有効なサイト設定データをパースできる', () => {
      const validData = {
        id: 'settings',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        site_title: 'テストサイト',
        site_description: 'サイトの説明',
      }
      const result = siteSettingsSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('全フィールドを含むサイト設定データをパースできる', () => {
      const validData = {
        id: 'settings',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        site_title: 'テストサイト',
        site_description: 'サイトの説明',
        default_og_image: {
          url: 'https://images.microcms-assets.io/og.jpg',
          height: 630,
          width: 1200,
        },
        google_analytics_id: 'GA-123456789',
        metadata: '{"custom": "data"}',
      }
      const result = siteSettingsSchema.parse(validData)
      expect(result).toEqual(validData)
    })
  })

  describe('pageCorporateSchema', () => {
    it('有効な固定ページデータをパースできる', () => {
      const validData = {
        id: 'page-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        title: 'テストページ',
        slug: 'test-page',
        content: 'ページの内容',
      }
      const result = pageCorporateSchema.parse(validData)
      expect(result).toEqual(validData)
    })
  })

  describe('createListResponseSchema', () => {
    it('リストレスポンススキーマを正しく生成できる', () => {
      const listSchema = createListResponseSchema(categorySchema)
      const validData = {
        contents: [
          {
            id: 'cat-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            name: 'カテゴリ1',
            slug: 'category-1',
          },
          {
            id: 'cat-2',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            name: 'カテゴリ2',
            slug: 'category-2',
          },
        ],
        totalCount: 2,
        offset: 0,
        limit: 10,
      }
      const result = listSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('空のリストレスポンスをパースできる', () => {
      const listSchema = createListResponseSchema(categorySchema)
      const validData = {
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 10,
      }
      const result = listSchema.parse(validData)
      expect(result).toEqual(validData)
    })
  })

  describe('型推論のテスト', () => {
    it('各型が正しく推論される', () => {
      // 型のテストは実行時には検証できないが、
      // TypeScriptのコンパイルが通ることで型の整合性を確認
      const base: MicroCMSBase = {
        id: 'test',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      const image: MicroCMSImage = {
        url: 'https://example.com/image.jpg',
        height: 100,
        width: 100,
      }

      const news: CorporateNews = {
        ...base,
        title: 'News',
        content: 'Content',
      }

      const expert: Expert = {
        ...base,
        name: 'Expert',
        slug: 'expert',
        role: ['執筆者'],
        profile: 'Profile',
      }

      const category: Category = {
        ...base,
        name: 'Category',
        slug: 'category',
      }

      const tag: Tag = {
        ...base,
        name: 'Tag',
        slug: 'tag',
      }

      const feature: Feature = {
        ...base,
        name: 'Feature',
        slug: 'feature',
        description: 'Description',
      }

      const article: MediaArticle = {
        ...base,
        title: 'Article',
        slug: 'article',
        type: 'article',
        membershipLevel: 'public',
        content: 'Content',
        heroImage: image,
      }

      const settings: SiteSettings = {
        ...base,
        site_title: 'Site',
        site_description: 'Description',
      }

      const page: PageCorporate = {
        ...base,
        title: 'Page',
        slug: 'page',
        content: 'Content',
      }

      // 型が正しく推論されていることを確認
      expect(base).toBeDefined()
      expect(image).toBeDefined()
      expect(news).toBeDefined()
      expect(expert).toBeDefined()
      expect(category).toBeDefined()
      expect(tag).toBeDefined()
      expect(feature).toBeDefined()
      expect(article).toBeDefined()
      expect(settings).toBeDefined()
      expect(page).toBeDefined()
    })
  })
})
