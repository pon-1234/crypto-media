import { client } from './client'
import type { Category } from '@/lib/schema/category.schema'
import type {
  MicroCMSQueries,
  MicroCMSListResponse,
  MicroCMSContentId,
} from 'microcms-js-sdk'

/**
 * Get all categories
 *
 * @doc Fetches all available categories from microCMS
 * @related src/lib/schema/category.schema.ts - Category type definition
 * @param queries - Optional microCMS query parameters
 * @returns Promise containing list of categories
 */
export const getCategories = async (
  queries?: MicroCMSQueries
): Promise<MicroCMSListResponse<Category>> => {
  return await client.getList<Category>({
    endpoint: 'categories',
    queries,
  })
}

/**
 * Get a single category by slug
 *
 * @doc Fetches a specific category by its slug identifier
 * @related src/lib/schema/category.schema.ts - Category type definition
 * @param slug - The category slug to fetch
 * @returns Promise containing the category data or null if not found
 */
export const getCategoryBySlug = async (
  slug: string
): Promise<Category | null> => {
  try {
    const response = await client.getList<Category>({
      endpoint: 'categories',
      queries: {
        filters: `slug[equals]${slug}`,
        limit: 1,
      },
    })
    return response.contents[0] || null
  } catch (error) {
    console.error('Error fetching category by slug:', error)
    return null
  }
}

/**
 * Get a single category by ID
 *
 * @doc Fetches a specific category by its microCMS ID
 * @related src/lib/schema/category.schema.ts - Category type definition
 * @param id - The microCMS content ID
 * @param queries - Optional microCMS query parameters
 * @returns Promise containing the category data
 */
export const getCategoryById = async (
  id: string,
  queries?: MicroCMSQueries
): Promise<Category & MicroCMSContentId> => {
  return await client.get<Category>({
    endpoint: 'categories',
    contentId: id,
    queries,
  })
}