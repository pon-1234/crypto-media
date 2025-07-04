/**
 * microCMSクライアントのテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 * @issue #2 - microCMSクライアントと型定義の実装
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import { createClient } from 'microcms-js-sdk'
import { isTestOrCI } from '@/lib/env/detect'

// モジュールのモック
vi.mock('microcms-js-sdk')
vi.mock('@/lib/env/detect')

const mockedCreateClient = createClient as Mock
const mockedIsTestOrCI = isTestOrCI as Mock

describe('microCMS Client', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    mockedCreateClient.mockClear()
    mockedIsTestOrCI.mockClear()

    process.env = {
      ...originalEnv,
      MICROCMS_SERVICE_DOMAIN: 'test-domain',
      MICROCMS_API_KEY: 'test-api-key',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('正しい設定でクライアントが作成される', async () => {
    mockedIsTestOrCI.mockReturnValue(false)
    await import('../client')
    expect(mockedCreateClient).toHaveBeenCalledWith({
      serviceDomain: 'test-domain',
      apiKey: 'test-api-key',
    })
  })

  it('テスト/CI環境ではダミークライアントが作成される', async () => {
    mockedIsTestOrCI.mockReturnValue(true)
    await import('../client')
    expect(mockedCreateClient).toHaveBeenCalledWith({
      serviceDomain: 'dummy-domain',
      apiKey: 'dummy-key',
    })
  })

  it('defaultQueriesが正しく設定されている', async () => {
    const { defaultQueries } = await import('../client')
    expect(defaultQueries).toEqual({
      limit: 100,
      orders: '-publishedAt',
    })
  })

  it('MAX_LIMITが正しく設定されている', async () => {
    const { MAX_LIMIT } = await import('../client')
    expect(MAX_LIMIT).toBe(100)
  })
})

describe('getOptimizedImageUrl', () => {
  let getOptimizedImageUrl: (
    url: string,
    options?: {
      width?: number
      height?: number
      format?: 'webp' | 'jpg' | 'png'
      quality?: number
    }
  ) => string

  beforeEach(async () => {
    vi.resetModules()
    // isTestOrCIのモックが影響しないように、実際のモジュールをインポート
    const clientModule =
      await vi.importActual<typeof import('../client')>('../client')
    getOptimizedImageUrl = clientModule.getOptimizedImageUrl
  })

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

describe('環境変数チェック', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    mockedIsTestOrCI.mockReturnValue(false)
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('MICROCMS_SERVICE_DOMAINが設定されていない場合にエラーをスローする', async () => {
    delete process.env.MICROCMS_SERVICE_DOMAIN
    process.env.MICROCMS_API_KEY = 'key' // 他の変数は定義しておく
    await expect(import('../client')).rejects.toThrow(
      'MICROCMS_SERVICE_DOMAIN is required'
    )
  })

  it('MICROCMS_API_KEYが設定されていない場合にエラーをスローする', async () => {
    delete process.env.MICROCMS_API_KEY
    process.env.MICROCMS_SERVICE_DOMAIN = 'domain' // 他の変数は定義しておく
    await expect(import('../client')).rejects.toThrow(
      'MICROCMS_API_KEY is required'
    )
  })
})
