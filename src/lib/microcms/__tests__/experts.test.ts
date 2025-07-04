/**
 * @file 執筆者・監修者関連APIのテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 */
import { describe, it, expect, vi } from 'vitest'
import {
  getExperts,
  getExpertById,
  getExpertBySlug,
  getAllExpertIds,
  getAllExpertSlugs,
} from '../experts'
import { client } from '../client'
import { getAllContents } from '../utils'

// microCMS client と utils をモック
vi.mock('../client')
vi.mock('../utils')

const mockedClient = vi.mocked(client)
const mockedGetAllContents = vi.mocked(getAllContents)

// ダミーデータ
const mockExpert1 = {
  id: 'expert-1',
  name: '山田 太郎',
  slug: 'yamada-taro',
  role: ['執筆者'],
  profile: 'プロフィール1',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  publishedAt: '2023-01-01T00:00:00Z',
  revisedAt: '2023-01-01T00:00:00Z',
}
const mockExpert2 = {
  id: 'expert-2',
  name: '鈴木 花子',
  slug: 'suzuki-hanako',
  role: ['監修者'],
  profile: 'プロフィール2',
  createdAt: '2023-01-02T00:00:00Z',
  updatedAt: '2023-01-02T00:00:00Z',
  publishedAt: '2023-01-02T00:00:00Z',
  revisedAt: '2023-01-02T00:00:00Z',
}
const mockExpertList = {
  contents: [mockExpert1, mockExpert2],
  totalCount: 2,
  offset: 0,
  limit: 10,
}

describe('experts.ts', () => {
  it('getExperts: 執筆者・監修者一覧を取得する', async () => {
    mockedClient.getList.mockResolvedValue(mockExpertList)
    const data = await getExperts()
    expect(data.contents).toHaveLength(2)
    expect(data.contents[0].name).toBe('山田 太郎')
    expect(mockedClient.getList).toHaveBeenCalledWith({
      endpoint: 'experts',
      queries: undefined,
    })
  })

  it('getExpertById: IDで執筆者・監修者を取得する', async () => {
    mockedClient.get.mockResolvedValue(mockExpert1)
    const data = await getExpertById('expert-1')
    expect(data.name).toBe('山田 太郎')
    expect(mockedClient.get).toHaveBeenCalledWith({
      endpoint: 'experts',
      contentId: 'expert-1',
      queries: undefined,
    })
  })

  it('getExpertBySlug: slugで執筆者・監修者を取得する', async () => {
    mockedClient.getList.mockResolvedValue({
      ...mockExpertList,
      contents: [mockExpert1],
    })
    const data = await getExpertBySlug('yamada-taro')
    expect(data.name).toBe('山田 太郎')
    expect(mockedClient.getList).toHaveBeenCalledWith({
      endpoint: 'experts',
      queries: {
        filters: `slug[equals]yamada-taro`,
        limit: 1,
      },
    })
  })

  it('getExpertBySlug: 見つからない場合はエラーをスローする', async () => {
    mockedClient.getList.mockResolvedValue({ ...mockExpertList, contents: [] })
    await expect(getExpertBySlug('not-found')).rejects.toThrow(
      'Expert not found: not-found'
    )
  })

  it('getAllExpertIds: すべてのIDを取得する', async () => {
    mockedGetAllContents.mockResolvedValue([
      { id: 'expert-1' },
      { id: 'expert-2' },
    ])
    const ids = await getAllExpertIds()
    expect(ids).toEqual(['expert-1', 'expert-2'])
    expect(mockedGetAllContents).toHaveBeenCalledWith('experts', {
      fields: 'id',
    })
  })

  it('getAllExpertSlugs: すべてのslugを取得する', async () => {
    const mockSlugsData = [
      { id: 'expert-1', slug: 'yamada-taro' },
      { id: 'expert-2', slug: 'suzuki-hanako' },
    ]
    mockedGetAllContents.mockResolvedValue(mockSlugsData)
    const slugs = await getAllExpertSlugs()
    expect(slugs).toEqual(['yamada-taro', 'suzuki-hanako'])
    expect(mockedGetAllContents).toHaveBeenCalledWith('experts', {
      fields: 'id,slug',
    })
  })
})
