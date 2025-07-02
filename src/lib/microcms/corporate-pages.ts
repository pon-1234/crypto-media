/**
 * @doc Corporate pages API client methods
 * @related DEVELOPMENT_GUIDE.md#pages_corporate
 * @issue https://github.com/pon-1234/crypto-media/issues/25
 */
import { client, defaultQueries } from './client'
import {
  corporatePageSchema,
  corporatePageListSchema,
  type CorporatePage,
  type CorporatePageList,
} from '@/lib/schema/corporate-page.schema'
import { isMicroCMS404Error, parseMicroCMSError } from './errors'

/**
 * Corporate page API query parameters
 */
type CorporatePageQueries = {
  draftKey?: string
  limit?: number
  offset?: number
}

/**
 * Get all corporate pages
 */
export async function getCorporatePages(
  queries?: CorporatePageQueries
): Promise<CorporatePageList> {
  const response = await client.get({
    endpoint: 'pages_corporate',
    queries: {
      ...defaultQueries,
      ...queries,
    },
  })

  return corporatePageListSchema.parse(response)
}

/**
 * Get a single corporate page by slug
 */
export async function getCorporatePageBySlug(
  slug: string,
  queries?: Pick<CorporatePageQueries, 'draftKey'>
): Promise<CorporatePage | null> {
  try {
    const response = await client.get({
      endpoint: 'pages_corporate',
      queries: {
        filters: `slug[equals]${slug}`,
        limit: 1,
        ...queries,
      },
    })

    const parsed = corporatePageListSchema.parse(response)
    return parsed.contents[0] || null
  } catch (error) {
    const microCMSError = parseMicroCMSError(error)
    if (isMicroCMS404Error(microCMSError)) {
      return null
    }
    throw microCMSError
  }
}

/**
 * Get a single corporate page by ID (for preview mode)
 */
export async function getCorporatePageById(
  id: string,
  queries?: Pick<CorporatePageQueries, 'draftKey'>
): Promise<CorporatePage | null> {
  try {
    const response = await client.get({
      endpoint: 'pages_corporate',
      contentId: id,
      queries,
    })

    return corporatePageSchema.parse(response)
  } catch (error) {
    const microCMSError = parseMicroCMSError(error)
    if (isMicroCMS404Error(microCMSError)) {
      return null
    }
    throw microCMSError
  }
}

/**
 * Check if a corporate page exists by slug
 */
export async function corporatePageExists(slug: string): Promise<boolean> {
  const page = await getCorporatePageBySlug(slug)
  return page !== null
}
