/**
 * @file microCMS関連のユーティリティ関数のテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 */
import { describe, it, expect, vi } from 'vitest'
import { getAllContents, stripHtmlTags } from '../utils'
import { client } from '../client'

// clientをモック化
vi.mock('../client')

const mockedClient = vi.mocked(client)

describe('microCMS utils', () => {
  describe('getAllContents', () => {
    beforeEach(() => {
      mockedClient.getList.mockClear()
    })

    it('複数ページにわたるコンテンツをすべて取得する', async () => {
      // 1回目のAPIレスポンス（1ページ目）
      mockedClient.getList
        .mockResolvedValueOnce({
          contents: Array.from({ length: 100 }, (_, i) => ({ id: `item-${i}`, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' })),
          totalCount: 150,
          offset: 0,
          limit: 100,
        })
        // 2回目のAPIレスポンス（2ページ目）
        .mockResolvedValueOnce({
          contents: Array.from({ length: 50 }, (_, i) => ({
            id: `item-${100 + i}`,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          })),
          totalCount: 150,
          offset: 100,
          limit: 100,
        })

      const allContents = await getAllContents('test-endpoint')
      expect(allContents).toHaveLength(150)
      expect(allContents[0].id).toBe('item-0')
      expect(allContents[149].id).toBe('item-149')
      expect(mockedClient.getList).toHaveBeenCalledTimes(2)
    })

    it('コンテンツが1ページに収まる場合は1回だけAPIを呼び出す', async () => {
      mockedClient.getList.mockResolvedValue({
        contents: Array.from({ length: 80 }, (_, i) => ({ id: `item-${i}`, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' })),
        totalCount: 80,
        offset: 0,
        limit: 100,
      })

      const allContents = await getAllContents('test-endpoint')
      expect(allContents).toHaveLength(80)
      expect(mockedClient.getList).toHaveBeenCalledOnce()
    })

    it('コンテンツが0件の場合も正しく動作する', async () => {
      mockedClient.getList.mockResolvedValue({
        contents: [],
        totalCount: 0,
        offset: 0,
        limit: 100,
      })

      const allContents = await getAllContents('test-endpoint')
      expect(allContents).toHaveLength(0)
      expect(mockedClient.getList).toHaveBeenCalledOnce()
    })
  })

  describe('stripHtmlTags', () => {
    it('HTMLタグを正しく除去する', () => {
      const html = '<p>これは<strong>テスト</strong>です。</p>'
      expect(stripHtmlTags(html)).toBe('これはテストです。')
    })

    it('複数のタグや属性があっても正しく除去する', () => {
      const html =
        '<div class="main"><a href="#" target="_blank">リンク</a></div>'
      expect(stripHtmlTags(html)).toBe('リンク')
    })

    it('HTMLエンティティをデコードする', () => {
      const html = '&lt;div&amp;&quot;&#039;&nbsp;test&gt;'
      expect(stripHtmlTags(html)).toEqual(`<div&"\' test>`)
    })

    it('連続する空白を1つにまとめる', () => {
      const html = 'テキスト  と  テキスト'
      expect(stripHtmlTags(html)).toBe('テキスト と テキスト')
    })

    it('空の文字列の場合は空の文字列を返す', () => {
      expect(stripHtmlTags('')).toBe('')
    })

    it('タグがない文字列はそのまま返す', () => {
      const text = 'これはプレーンテキストです。'
      expect(stripHtmlTags(text)).toBe('これはプレーンテキストです。')
    })
  })
}) 