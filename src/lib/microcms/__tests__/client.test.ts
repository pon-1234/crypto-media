/**
 * microCMSクライアントのテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { createClient } from 'microcms-js-sdk'

// 環境変数をモック - importの前に設定
process.env.MICROCMS_SERVICE_DOMAIN = 'test-domain'
process.env.MICROCMS_API_KEY = 'test-api-key'

// microcms-js-sdkのモック
vi.mock('microcms-js-sdk', () => ({
  createClient: vi.fn().mockReturnValue({
    get: vi.fn(),
    getList: vi.fn(),
    getListDetail: vi.fn(),
  }),
}))

// モジュールを動的にインポート
let client: any
let defaultQueries: any
let MAX_LIMIT: any
let getOptimizedImageUrl: any

beforeAll(async () => {
  const module = await import('../client')
  client = module.client
  defaultQueries = module.defaultQueries
  MAX_LIMIT = module.MAX_LIMIT
  getOptimizedImageUrl = module.getOptimizedImageUrl
})

describe('microCMS Client', () => {
  describe('クライアント初期化', () => {
    it('正しい設定でクライアントが作成される', () => {
      expect(createClient).toHaveBeenCalledWith({
        serviceDomain: 'test-domain',
        apiKey: 'test-api-key',
      })
      expect(client).toBeDefined()
    })

    it('環境変数のバリデーション', () => {
      // 環境変数が設定されていることを確認
      expect(process.env.MICROCMS_SERVICE_DOMAIN).toBe('test-domain')
      expect(process.env.MICROCMS_API_KEY).toBe('test-api-key')
    })
  })

  describe('共通設定', () => {
    it('defaultQueriesが正しく設定されている', () => {
      expect(defaultQueries).toEqual({
        limit: 100,
        orders: '-publishedAt',
      })
    })

    it('MAX_LIMITが正しく設定されている', () => {
      expect(MAX_LIMIT).toBe(100)
    })
  })

  describe('getOptimizedImageUrl', () => {
    const baseUrl = 'https://images.microcms-assets.io/assets/test/image.jpg'

    it('オプションなしでURLを返す', () => {
      const result = getOptimizedImageUrl(baseUrl)
      expect(result).toBe(`${baseUrl}?`)
    })

    it('幅のみ指定した場合', () => {
      const result = getOptimizedImageUrl(baseUrl, { width: 800 })
      expect(result).toBe(`${baseUrl}?w=800`)
    })

    it('高さのみ指定した場合', () => {
      const result = getOptimizedImageUrl(baseUrl, { height: 600 })
      expect(result).toBe(`${baseUrl}?h=600`)
    })

    it('フォーマットのみ指定した場合', () => {
      const result = getOptimizedImageUrl(baseUrl, { format: 'webp' })
      expect(result).toBe(`${baseUrl}?fm=webp`)
    })

    it('品質のみ指定した場合', () => {
      const result = getOptimizedImageUrl(baseUrl, { quality: 85 })
      expect(result).toBe(`${baseUrl}?q=85`)
    })

    it('すべてのオプションを指定した場合', () => {
      const result = getOptimizedImageUrl(baseUrl, {
        width: 1200,
        height: 630,
        format: 'jpg',
        quality: 90,
      })
      expect(result).toBe(`${baseUrl}?w=1200&h=630&fm=jpg&q=90`)
    })

    it('複数のオプションを部分的に指定した場合', () => {
      const result = getOptimizedImageUrl(baseUrl, {
        width: 600,
        format: 'webp',
      })
      expect(result).toBe(`${baseUrl}?w=600&fm=webp`)
    })
  })
})

describe('環境変数チェック', () => {
  it('環境変数が設定されていない場合にエラーをスローする', async () => {
    // 環境変数を一時的に削除
    const originalServiceDomain = process.env.MICROCMS_SERVICE_DOMAIN
    const originalApiKey = process.env.MICROCMS_API_KEY
    
    vi.resetModules()
    
    // サービスドメインがない場合
    delete process.env.MICROCMS_SERVICE_DOMAIN
    process.env.MICROCMS_API_KEY = 'test-key'
    
    await expect(async () => {
      await import('../client')
    }).rejects.toThrow('MICROCMS_SERVICE_DOMAIN is required')
    
    // APIキーがない場合
    process.env.MICROCMS_SERVICE_DOMAIN = 'test-domain'
    delete process.env.MICROCMS_API_KEY
    vi.resetModules()
    
    await expect(async () => {
      await import('../client')
    }).rejects.toThrow('MICROCMS_API_KEY is required')
    
    // 環境変数を復元
    process.env.MICROCMS_SERVICE_DOMAIN = originalServiceDomain
    process.env.MICROCMS_API_KEY = originalApiKey
  })
})