/**
 * @file 特集記事関連APIのテスト
 * @doc DEVELOPMENT_GUIDE.md#microCMS
 */
import { describe, it, expect, vi } from 'vitest'
import {
  getFeatures,
  getFeatureById,
  getFeatureBySlug,
  getAllFeatureIds,
  getAllFeatureSlugs,
} from '../features'
import { client } from '../client'
import { getAllContents } from '../utils'

// microCMS client と utils をモック
vi.mock('../client')
vi.mock('../utils')

const mockedClient = vi.mocked(client)
const mockedGetAllContents = vi.mocked(getAllContents)

// ダミーデータ
const mockFeature1 = {
  id: 'feature-1',
  name: '特集1',
  slug: 'feature-1',
  description: '説明1',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  publishedAt: '2023-01-01T00:00:00Z',
  revisedAt: '2023-01-01T00:00:00Z',
}
const mockFeature2 = {
  id: 'feature-2',
  name: '特集2',
  slug: 'feature-2',
  description: '説明2',
  createdAt: '2023-01-02T00:00:00Z',
  updatedAt: '2023-01-02T00:00:00Z',
  publishedAt: '2023-01-02T00:00:00Z',
  revisedAt: '2023-01-02T00:00:00Z',
}
const mockFeatureList = {
  contents: [mockFeature1, mockFeature2],
  totalCount: 2,
  offset: 0,
  limit: 10,
}

describe('features.ts', () => {
  it('getFeatures: 特集一覧を取得する', async () => {
    mockedClient.getList.mockResolvedValue(mockFeatureList)
    const data = await getFeatures()
    expect(data.contents).toHaveLength(2)
    expect(data.contents[0].name).toBe('特集1')
    expect(mockedClient.getList).toHaveBeenCalledWith({
      endpoint: 'features',
      queries: undefined,
    })
  })

  it('getFeatureById: IDで特集を取得する', async () => {
    mockedClient.get.mockResolvedValue(mockFeature1)
    const data = await getFeatureById('feature-1')
    expect(data.name).toBe('特集1')
    expect(mockedClient.get).toHaveBeenCalledWith({
      endpoint: 'features',
      contentId: 'feature-1',
      queries: undefined,
    })
  })

  it('getFeatureBySlug: slugで特集を取得する', async () => {
    mockedClient.getList.mockResolvedValue({
      ...mockFeatureList,
      contents: [mockFeature1],
    })
    const data = await getFeatureBySlug('feature-1')
    expect(data.name).toBe('特集1')
    expect(mockedClient.getList).toHaveBeenCalledWith({
      endpoint: 'features',
      queries: {
        filters: `slug[equals]feature-1`,
        limit: 1,
      },
    })
  })

  it('getFeatureBySlug: 見つからない場合はエラーをスローする', async () => {
    mockedClient.getList.mockResolvedValue({ ...mockFeatureList, contents: [] })
    await expect(getFeatureBySlug('not-found')).rejects.toThrow(
      'Feature not found: not-found'
    )
  })

  it('getAllFeatureIds: すべてのIDを取得する', async () => {
    mockedGetAllContents.mockResolvedValue([
      { id: 'feature-1' },
      { id: 'feature-2' },
    ])
    const ids = await getAllFeatureIds()
    expect(ids).toEqual(['feature-1', 'feature-2'])
    expect(mockedGetAllContents).toHaveBeenCalledWith('features', {
      fields: 'id',
    })
  })

  it('getAllFeatureSlugs: すべてのslugを取得する', async () => {
    const mockSlugsData = [
      { id: 'feature-1', slug: 'feature-1' },
      { id: 'feature-2', slug: 'feature-2' },
    ]
    mockedGetAllContents.mockResolvedValue(mockSlugsData)
    const slugs = await getAllFeatureSlugs()
    expect(slugs).toEqual(['feature-1', 'feature-2'])
    expect(mockedGetAllContents).toHaveBeenCalledWith('features', {
      fields: 'id,slug',
    })
  })
})
