import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchMediaArticles, highlightSearchQuery } from '../search'
import { client } from '../client'

// Mock the client
vi.mock('../client', () => ({
  client: {
    getList: vi.fn(),
  },
}))

describe('searchMediaArticles', () => {
  const mockArticles = {
    contents: [
      {
        id: '1',
        type: 'article' as const,
        title: 'ビットコインの最新動向',
        slug: 'bitcoin-news',
        description: 'ビットコインに関する記事',
        content: 'コンテンツ',
        heroImage: { url: 'https://example.com/image.jpg', width: 1200, height: 630 },
        publishedAt: '2024-01-01T00:00:00.000Z',
        membershipLevel: 'public' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    totalCount: 1,
    offset: 0,
    limit: 20,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('検索キーワードで記事を検索できる', async () => {
    vi.mocked(client.getList).mockResolvedValue(mockArticles)

    const result = await searchMediaArticles('ビットコイン')

    expect(client.getList).toHaveBeenCalledWith({
      endpoint: 'media_articles',
      queries: {
        q: 'ビットコイン',
        limit: 20,
        offset: 0,
        orders: '-publishedAt',
      },
    })
    expect(result.totalCount).toBe(1)
    expect(result.contents).toHaveLength(1)
    expect(result.contents[0].title).toBe('ビットコインの最新動向')
  })

  it('カスタムのlimitとoffsetを指定できる', async () => {
    vi.mocked(client.getList).mockResolvedValue(mockArticles)

    await searchMediaArticles('イーサリアム', { limit: 10, offset: 5 })

    expect(client.getList).toHaveBeenCalledWith({
      endpoint: 'media_articles',
      queries: {
        q: 'イーサリアム',
        limit: 10,
        offset: 5,
        orders: '-publishedAt',
      },
    })
  })

  it('エラー時は例外をスローする', async () => {
    vi.mocked(client.getList).mockRejectedValue(new Error('API Error'))

    await expect(searchMediaArticles('DeFi')).rejects.toThrow('記事の検索に失敗しました')
  })

  it('空の検索結果を正しく処理する', async () => {
    const emptyResult = {
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 20,
    }
    vi.mocked(client.getList).mockResolvedValue(emptyResult)

    const result = await searchMediaArticles('存在しないキーワード')

    expect(result).toEqual(emptyResult)
    expect(result.contents).toHaveLength(0)
  })
})

describe('highlightSearchQuery', () => {
  it('検索キーワードがハイライトされる', () => {
    const text = 'ビットコインとイーサリアムの価格が上昇'
    const query = 'ビットコイン'
    
    const result = highlightSearchQuery(text, query)
    
    expect(result).toHaveLength(3)
    expect(result[0]).toBe('')
    expect(result[1]).toMatchObject({
      type: 'mark',
      key: 1,
      text: 'ビットコイン',
    })
    expect(result[2]).toBe('とイーサリアムの価格が上昇')
  })

  it('大文字小文字を区別しない', () => {
    const text = 'Bitcoin and BITCOIN'
    const query = 'bitcoin'
    
    const result = highlightSearchQuery(text, query)
    
    expect(result).toHaveLength(5)
    expect(result[1]).toMatchObject({
      type: 'mark',
      text: 'Bitcoin',
    })
    expect(result[3]).toMatchObject({
      type: 'mark',
      text: 'BITCOIN',
    })
  })

  it('複数の一致箇所をハイライトする', () => {
    const text = 'DeFiの革新とDeFiプロトコル'
    const query = 'DeFi'
    
    const result = highlightSearchQuery(text, query)
    
    expect(result).toHaveLength(5)
    expect(result[1]).toMatchObject({
      type: 'mark',
      text: 'DeFi',
    })
    expect(result[3]).toMatchObject({
      type: 'mark',
      text: 'DeFi',
    })
  })

  it('正規表現の特殊文字をエスケープする', () => {
    const text = 'Web3.0の未来'
    const query = '3.0'
    
    const result = highlightSearchQuery(text, query)
    
    expect(result).toHaveLength(3)
    expect(result[1]).toMatchObject({
      type: 'mark',
      text: '3.0',
    })
  })

  it('空のクエリの場合は元のテキストを返す', () => {
    const text = 'ブロックチェーン技術'
    const query = ''
    
    const result = highlightSearchQuery(text, query)
    
    expect(result).toEqual(['ブロックチェーン技術'])
  })

  it('一致しない場合は元のテキストを返す', () => {
    const text = 'ブロックチェーン技術'
    const query = '人工知能'
    
    const result = highlightSearchQuery(text, query)
    
    expect(result).toEqual(['ブロックチェーン技術'])
  })
})