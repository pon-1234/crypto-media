import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ArticleGrid } from '@/components/media/ArticleGrid'
import { Pagination } from '@/components/ui/Pagination'
import {
  getCategories,
  getCategoryBySlug,
  getMediaArticlesByCategory,
} from '@/lib/microcms'

export const dynamicParams = false

interface CategoryPageProps {
  params: {
    slug: string
  }
  searchParams?: {
    page?: string
  }
}

/**
 * Generate dynamic metadata for category pages
 *
 * @doc Creates SEO-optimized metadata for each category
 * @param props - Page props containing category slug
 * @returns Metadata object
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  // CI環境ではデフォルトメタデータを返す
  if (process.env.CI === 'true') {
    return {
      title: 'Category | Crypto Media',
      description: '暗号資産・ブロックチェーンに関するカテゴリ記事一覧です。',
    }
  }

  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    return {
      title: 'カテゴリが見つかりません',
    }
  }

  return {
    title: `${category.name} | Crypto Media`,
    description: `${category.name}に関する最新の記事一覧です。暗号資産・ブロックチェーンの専門情報をお届けします。`,
    openGraph: {
      title: `${category.name} | Crypto Media`,
      description: `${category.name}に関する最新の記事一覧です。`,
      type: 'website',
    },
    alternates: {
      canonical: `/media/category/${params.slug}`,
    },
  }
}

/**
 * Generate static params for all categories
 *
 * @doc Pre-renders all category pages at build time
 * @returns Array of category slugs
 */
export async function generateStaticParams() {
  // CI環境では静的パラメータ生成をスキップ
  if (process.env.CI === 'true' || !process.env.MICROCMS_API_KEY) {
    return []
  }

  try {
    const categories = await getCategories({ limit: 100 })
    return categories.contents.map((category) => ({
      slug: category.slug,
    }))
  } catch (error) {
    console.warn('Failed to generate static params for categories:', error)
    return []
  }
}

/**
 * Category articles list page
 *
 * @doc Displays all articles belonging to a specific category
 * @related src/lib/microcms/categories.ts - Category API methods
 * @related src/lib/microcms/media-articles.ts - Article filtering methods
 * @param props - Page props containing category slug
 * @returns Category page component
 */
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const currentPage = Number(searchParams?.page) || 1
  const limit = 12 // 1ページあたりの表示件数
  const offset = (currentPage - 1) * limit
  // CI環境ではダミーページを返す
  if (process.env.CI === 'true') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">カテゴリページ</h1>
          <p className="text-gray-600">CI環境でのビルド用ダミーページです。</p>
        </div>
      </div>
    )
  }

  // Fetch category details
  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    notFound()
    return null // This line won't be reached but TypeScript needs it
  }

  // Fetch articles for this category
  const articlesResponse = await getMediaArticlesByCategory(params.slug, {
    limit,
    offset,
    orders: '-publishedAt',
  })

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { label: 'HOME', href: '/' },
    { label: 'MEDIA', href: '/media' },
    { label: category.name },
  ]

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name}の記事一覧`,
    description: `${category.name}に関する最新の暗号資産・ブロックチェーン記事`,
    url: `https://example.co.jp/media/category/${params.slug}`,
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
        <h1 className="mb-4 text-3xl font-bold">{category.name}の記事一覧</h1>
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
