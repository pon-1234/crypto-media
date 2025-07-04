/**
 * 特集詳細ページ
 * @doc DEVELOPMENT_GUIDE.md#URL構造と主要ページ一覧
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArticleCard } from '@/components/media/ArticleCard'
import {
  getFeatureBySlug,
  getAllFeatureSlugs,
  getMediaArticlesByFeature,
} from '@/lib/microcms'

type Props = {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  // CI環境では静的生成をスキップ
  if (process.env.CI === 'true' || !process.env.MICROCMS_API_KEY) {
    return []
  }

  try {
    const slugs = await getAllFeatureSlugs()
    return slugs.map((slug) => ({
      slug,
    }))
  } catch (error) {
    console.warn('Failed to generate static params for features:', error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // CI環境では静的なメタデータを返す
  if (process.env.CI === 'true' || !process.env.MICROCMS_API_KEY) {
    return {
      title: '特集 | 暗号資産総合メディア',
    }
  }

  try {
    const feature = await getFeatureBySlug(params.slug)
    return {
      title: `${feature.name} | 特集 | 暗号資産総合メディア`,
      description: feature.description,
    }
  } catch {
    return {
      title: '特集 | 暗号資産総合メディア',
    }
  }
}

/**
 * 特集詳細ページコンポーネント
 * @param params URLパラメータ
 * @returns 特集詳細と関連記事表示
 */
export default async function FeatureDetailPage({ params }: Props) {
  // CI環境では404を返す
  if (process.env.CI === 'true' || !process.env.MICROCMS_API_KEY) {
    notFound()
    return
  }

  let feature
  try {
    feature = await getFeatureBySlug(params.slug)
  } catch {
    notFound()
    return
  }

  // 特集に属する記事を取得
  const { contents: articles } = await getMediaArticlesByFeature(feature.id, {
    limit: 50,
    orders: '-publishedAt',
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* 特集ヘッダー */}
        <div className="mb-12">
          {feature.heroImage && (
            <div className="relative mb-8 h-64 overflow-hidden rounded-lg md:h-96">
              <Image
                src={feature.heroImage.url}
                alt={feature.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <h1 className="mb-4 text-4xl font-bold">{feature.name}</h1>
          <p className="whitespace-pre-wrap text-lg text-gray-700">
            {feature.description}
          </p>
        </div>

        {/* 記事一覧セクション */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">
            関連記事
            {articles.length > 0 && (
              <span className="ml-2 text-base font-normal text-gray-600">
                （{articles.length}件）
              </span>
            )}
          </h2>

          {articles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-gray-600">
              この特集に関連する記事はまだありません。
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
