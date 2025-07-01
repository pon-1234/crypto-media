import { client } from './client'
import type { Tag } from '@/lib/schema/tag.schema'
import type {
  MicroCMSQueries,
  MicroCMSListResponse,
  MicroCMSContentId,
} from 'microcms-js-sdk'

/**
 * Get all tags
 *
 * @doc Fetches all available tags from microCMS
 * @related src/lib/schema/tag.schema.ts - Tag type definition
 * @param queries - Optional microCMS query parameters
 * @returns Promise containing list of tags
 */
export const getTags = async (
  queries?: MicroCMSQueries
): Promise<MicroCMSListResponse<Tag>> => {
  return await client.getList<Tag>({
    endpoint: 'tags',
    queries,
  })
}

/**
 * Get a single tag by slug
 *
 * @doc Fetches a specific tag by its slug identifier
 * @related src/lib/schema/tag.schema.ts - Tag type definition
 * @param slug - The tag slug to fetch
 * @returns Promise containing the tag data or null if not found
 */
export const getTagBySlug = async (slug: string): Promise<Tag | null> => {
  try {
    const response = await client.getList<Tag>({
      endpoint: 'tags',
      queries: {
        filters: `slug[equals]${slug}`,
        limit: 1,
      },
    })
    return response.contents[0] || null
  } catch (error) {
    console.error('Error fetching tag by slug:', error)
    return null
  }
}

/**
 * Get a single tag by ID
 *
 * @doc Fetches a specific tag by its microCMS ID
 * @related src/lib/schema/tag.schema.ts - Tag type definition
 * @param id - The microCMS content ID
 * @param queries - Optional microCMS query parameters
 * @returns Promise containing the tag data
 */
export const getTagById = async (
  id: string,
  queries?: MicroCMSQueries
): Promise<Tag & MicroCMSContentId> => {
  return await client.get<Tag>({
    endpoint: 'tags',
    contentId: id,
    queries,
  })
}
