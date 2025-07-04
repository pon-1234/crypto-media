import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ArticleGrid } from '@/components/media/ArticleGrid'
import { Pagination } from '@/components/ui/Pagination'
import { getTags, getTagBySlug, getMediaArticlesByTag } from '@/lib/microcms'

export const dynamicParams = false

interface TagPageProps {
  params: {
    slug: string
  }
  searchParams?: {
    page?: string
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
  // CI環境ではデフォルトメタデータを返す
  if (process.env.CI === 'true') {
    return {
      title: 'Tag | Crypto Media',
      description: '暗号資産・ブロックチェーンに関するタグ記事一覧です。',
    }
  }

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
  // CI環境では静的パラメータ生成をスキップ
  if (process.env.CI === 'true' || !process.env.MICROCMS_API_KEY) {
    return []
  }

  try {
    const tags = await getTags({ limit: 100 })
    return tags.contents.map((tag) => ({
      slug: tag.slug,
    }))
  } catch (error) {
    console.warn('Failed to generate static params for tags:', error)
    return []
  }
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
export default async function TagPage({ params, searchParams }: TagPageProps) {
  const currentPage = Number(searchParams?.page) || 1
  const limit = 12 // 1ページあたりの表示件数
  const offset = (currentPage - 1) * limit
  // CI環境ではダミーページを返す
  if (process.env.CI === 'true') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">タグページ</h1>
          <p className="text-gray-600">CI環境でのビルド用ダミーページです。</p>
        </div>
      </div>
    )
  }

  // Fetch tag details
  const tag = await getTagBySlug(params.slug)

  if (!tag) {
    notFound()
    return null // This line won't be reached but TypeScript needs it
  }

  // Fetch articles for this tag
  const articlesResponse = await getMediaArticlesByTag(params.slug, {
    limit,
    offset,
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
        <h1 className="mb-4 text-3xl font-bold">{tag.name}の記事一覧</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {articlesResponse.totalCount}件の記事が見つかりました
        </p>
      </header>

      <ArticleGrid articles={articlesResponse.contents} />

      {/* ページネーション */}
      {articlesResponse.totalCount > limit && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(articlesResponse.totalCount / limit)}
            className="mt-8"
          />
        </div>
      )}
    </div>
  )
}
