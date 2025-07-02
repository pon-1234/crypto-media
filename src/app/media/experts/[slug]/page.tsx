/**
 * 執筆者・監修者詳細ページ
 * @doc DEVELOPMENT_GUIDE.md#URL構造と主要ページ一覧
 * @issue #27 - メディアサイトの主要ページ実装
 */
import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArticleCard } from '@/components/media/ArticleCard'
import {
  getExpertBySlug,
  getAllExpertSlugs,
  getMediaArticlesByAuthor,
  getMediaArticlesBySupervisor,
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
    const slugs = await getAllExpertSlugs()
    return slugs.map((slug) => ({
      slug,
    }))
  } catch (error) {
    console.warn('Failed to generate static params for experts:', error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // CI環境では静的なメタデータを返す
  if (process.env.CI === 'true' || !process.env.MICROCMS_API_KEY) {
    return {
      title: '執筆者・監修者 | 暗号資産総合メディア',
    }
  }

  try {
    const expert = await getExpertBySlug(params.slug)
    return {
      title: `${expert.name} | 執筆者・監修者 | 暗号資産総合メディア`,
      description: expert.profile,
    }
  } catch {
    return {
      title: '執筆者・監修者 | 暗号資産総合メディア',
    }
  }
}

/**
 * 執筆者・監修者詳細ページコンポーネント
 * @param params URLパラメータ
 * @returns 執筆者・監修者詳細表示
 */
export default async function ExpertDetailPage({ params }: Props) {
  // CI環境では404を返す
  if (process.env.CI === 'true' || !process.env.MICROCMS_API_KEY) {
    notFound()
    return
  }

  let expert
  try {
    expert = await getExpertBySlug(params.slug)
  } catch {
    notFound()
    return
  }

  // 執筆記事と監修記事を並行して取得
  const [authorArticles, supervisorArticles] = await Promise.all([
    expert.role.includes('執筆者')
      ? getMediaArticlesByAuthor(expert.id, { limit: 20 })
      : Promise.resolve({ contents: [], totalCount: 0, offset: 0, limit: 0 }),
    expert.role.includes('監修者')
      ? getMediaArticlesBySupervisor(expert.id, { limit: 20 })
      : Promise.resolve({ contents: [], totalCount: 0, offset: 0, limit: 0 }),
  ])

  // 重複を除いた記事一覧を作成
  const allArticleIds = new Set<string>()
  const allArticles = [
    ...authorArticles.contents,
    ...supervisorArticles.contents,
  ].filter((article) => {
    if (allArticleIds.has(article.id)) {
      return false
    }
    allArticleIds.add(article.id)
    return true
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* プロフィールセクション */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {expert.avatar && (
              <div className="flex-shrink-0">
                <Image
                  src={expert.avatar.url}
                  alt={expert.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{expert.name}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {expert.role.map((role) => (
                  <span
                    key={role}
                    className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {expert.profile}
              </p>
            </div>
          </div>
        </div>

        {/* 記事一覧セクション */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {expert.name}の記事
            {allArticles.length > 0 && (
              <span className="text-base font-normal text-gray-600 ml-2">
                （{allArticles.length}件）
              </span>
            )}
          </h2>

          {allArticles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {allArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-12">
              まだ記事が投稿されていません。
            </p>
          )}
        </section>
      </div>
    </main>
  )
}