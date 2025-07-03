import type { MediaArticle } from '@/lib/schema'

/**
 * Generates a mock media article object.
 *
 * @param overrides - Partial data to override the default mock article.
 * @returns A mock media article.
 */
export const mockMediaArticle = (
  overrides: Partial<MediaArticle> = {}
): MediaArticle => {
  const id = overrides.id || `article-${Math.random().toString(36).substring(7)}`
  return {
    id,
    slug: overrides.slug || `slug-${id}`,
    title: overrides.title || `記事タイトル ${id}`,
    content: overrides.content || `<p>記事本文 ${id}</p>`,
    type: overrides.type || 'article',
    membershipLevel: overrides.membershipLevel || 'public',
    heroImage: overrides.heroImage || {
      url: 'https://via.placeholder.com/1200x630',
      height: 630,
      width: 1200,
    },
    category: overrides.category,
    tags: overrides.tags,
    author: overrides.author,
    supervisor: overrides.supervisor,
    features: overrides.features,
    previewContent: overrides.previewContent,
    paywallCTA: overrides.paywallCTA,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    publishedAt: overrides.publishedAt || new Date().toISOString(),
    revisedAt: overrides.revisedAt || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generates an array of mock media articles.
 *
 * @param count - The number of articles to generate.
 * @param overrides - Partial data to override the default mock articles.
 * @returns An array of mock media articles.
 */
export const mockMediaArticles = (
  count: number,
  overrides?: Partial<MediaArticle>
): MediaArticle[] => {
  return Array.from({ length: count }, (_, i) =>
    mockMediaArticle({ id: `article-${i}`, ...overrides })
  )
} 