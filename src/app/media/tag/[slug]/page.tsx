import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ArticleGrid } from '@/components/media/ArticleGrid'
import { getTags, getTagBySlug, getMediaArticlesByTag } from '@/lib/microcms'

interface TagPageProps {
  params: {
    slug: string
  }
}

/**
 * Generate dynamic metadata for tag pages
 *
 * @doc Creates SEO-optimized metadata for each tag
 * @param props - Page props containing tag slug
 * @returns Metadata object
 */
export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const tag = await getTagBySlug(params.slug)

  if (!tag) {
    return {
      title: 'タグが見つかりません',
    }
  }

  return {
    title: `${tag.name} | Crypto Media`,
    description: `${tag.name}に関する最新の記事一覧です。暗号資産・ブロックチェーンの専門情報をお届けします。`,
    openGraph: {
      title: `${tag.name} | Crypto Media`,
      description: `${tag.name}に関する最新の記事一覧です。`,
      type: 'website',
    },
    alternates: {
      canonical: `/media/tag/${params.slug}`,
    },
  }
}

/**
 * Generate static params for all tags
 *
 * @doc Pre-renders all tag pages at build time
 * @returns Array of tag slugs
 */
export async function generateStaticParams() {
  const tags = await getTags({ limit: 100 })
  return tags.contents.map((tag) => ({
    slug: tag.slug,
  }))
}

/**
 * Tag articles list page
 *
 * @doc Displays all articles tagged with a specific tag
 * @related src/lib/microcms/tags.ts - Tag API methods
 * @related src/lib/microcms/media-articles.ts - Article filtering methods
 * @param props - Page props containing tag slug
 * @returns Tag page component
 */
export default async function TagPage({ params }: TagPageProps) {

  // Fetch tag details
  const tag = await getTagBySlug(params.slug)

  if (!tag) {
    notFound()
    return null // This line won't be reached but TypeScript needs it
  }

  // Fetch articles for this tag
  const articlesResponse = await getMediaArticlesByTag(params.slug, {
    limit: 20,
    orders: '-publishedAt',
  })

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { label: 'HOME', href: '/' },
    { label: 'MEDIA', href: '/media' },
    { label: tag.name },
  ]

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${tag.name}の記事一覧`,
    description: `${tag.name}に関する最新の暗号資産・ブロックチェーン記事`,
    url: `https://example.co.jp/media/tag/${params.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articlesResponse.contents.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://example.co.jp/media/articles/${article.slug}`,
      })),
    },
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{tag.name}の記事一覧</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {articlesResponse.totalCount}件の記事が見つかりました
        </p>
      </header>

      <ArticleGrid articles={articlesResponse.contents} />

      {/* TODO: Add pagination component when implemented */}
      {articlesResponse.totalCount > articlesResponse.contents.length && (
        <div className="mt-8 text-center text-gray-500">
          <p>さらに記事を読み込む機能は準備中です</p>
        </div>
      )}
    </div>
  )
}