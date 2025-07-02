import { z } from 'zod'
import { microCMSImageSchema } from './image.schema'

/**
 * @doc Corporate page content schema for microCMS
 * @related /about, /service, /privacy-policy, /terms pages
 * @issue https://github.com/pon-1234/crypto-media/issues/25
 */
export const corporatePageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  sections: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        type: z.enum(['text', 'table', 'list']),
      })
    )
    .optional(),
  metadata: z
    .object({
      ogImage: microCMSImageSchema.optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  revisedAt: z.string().optional(),
})

export type CorporatePage = z.infer<typeof corporatePageSchema>

/**
 * @doc API response schema for list endpoints
 */
export const corporatePageListSchema = z.object({
  contents: z.array(corporatePageSchema),
  totalCount: z.number(),
  offset: z.number(),
  limit: z.number(),
})

export type CorporatePageList = z.infer<typeof corporatePageListSchema>
