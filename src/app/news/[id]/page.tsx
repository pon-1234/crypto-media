import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCorporateNewsDetail, getAllCorporateNewsIds } from '@/lib/microcms'
import { RichTextRenderer } from '@/components/ui/RichTextRenderer'
import { formatDate } from '@/lib/utils/date'
import { handleError } from '@/lib/utils/handleError'

/**
 * コーポレートお知らせ詳細ページ
 * 
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const ids = await getAllCorporateNewsIds()
  return ids.map((id) => ({
    id,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const news = await getCorporateNewsDetail(id)
    
    return {
      title: `${news.title} | お知らせ | 株式会社Example`,
      description: `${news.title}の詳細をご覧いただけます。`,
      openGraph: {
        title: news.title,
        description: `${news.title}の詳細をご覧いただけます。`,
        type: 'article',
        publishedTime: news.publishedAt || news.createdAt,
        modifiedTime: news.updatedAt || news.createdAt,
      },
    }
  } catch (error) {
    handleError(error, `Failed to generate metadata for news: ${id}`)
    return {
      title: 'お知らせ | 株式会社Example',
    }
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params
  
  let news
  try {
    news = await getCorporateNewsDetail(id)
  } catch (error) {
    // クライアント側でエラーログは出力済み
    notFound()
  }

  return (
    <article className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* パンくずリスト */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-blue-600 hover:underline">
                ホーム
              </Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <Link href="/news" className="text-blue-600 hover:underline">
                お知らせ
              </Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li className="text-gray-500">{news.title}</li>
          </ol>
        </nav>

        {/* ヘッダー */}
        <header className="mb-8">
          <time className="text-sm text-gray-600">
            {formatDate(news.publishedAt || news.createdAt)}
          </time>
          <h1 className="text-3xl font-bold mt-2 mb-4">{news.title}</h1>
        </header>

        {/* 本文 */}
        <RichTextRenderer 
          content={news.content} 
          className="mb-12"
        />

        {/* 一覧に戻るリンク */}
        <div className="border-t pt-8">
          <Link 
            href="/news" 
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            お知らせ一覧に戻る
          </Link>
        </div>
      </div>
    </article>
  )
}