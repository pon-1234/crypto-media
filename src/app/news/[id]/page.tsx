import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { getCorporateNewsDetail, getAllCorporateNewsIds } from '@/lib/microcms'
import { RichTextRenderer } from '@/components/ui/RichTextRenderer'
import { formatDate } from '@/lib/utils/date'

/**
 * コーポレートお知らせ詳細ページ
 *
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

interface PageProps {
  params: { id: string }
  searchParams: { draftKey?: string }
}

export async function generateStaticParams() {
  // CI環境では静的パラメータ生成をスキップ
  if (process.env.CI === 'true') {
    return []
  }

  const ids = await getAllCorporateNewsIds()
  return ids.map((id) => ({
    id,
  }))
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { id } = params
  const { draftKey } = searchParams

  // CI環境ではデフォルトメタデータを返す
  if (process.env.CI === 'true') {
    return {
      title: 'お知らせ | 株式会社Example',
      description: 'コーポレートお知らせの詳細をご覧いただけます。',
    }
  }

  // プレビューモードの確認
  const { isEnabled: isDraftMode } = await draftMode()

  try {
    const news = await getCorporateNewsDetail(
      id,
      isDraftMode && draftKey ? { draftKey } : undefined
    )

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
    console.error(`Failed to generate metadata for news: ${id}`, error)
    return {
      title: 'お知らせ | 株式会社Example',
    }
  }
}

export default async function NewsDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = params
  const { draftKey } = searchParams

  // CI環境ではダミーページを返す
  if (process.env.CI === 'true') {
    return (
      <article className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold">お知らせ詳細</h1>
            <p className="text-gray-600">
              CI環境でのビルド用ダミーページです。
            </p>
          </div>
        </div>
      </article>
    )
  }

  // プレビューモードの確認
  const { isEnabled: isDraftMode } = await draftMode()

  let news
  try {
    news = await getCorporateNewsDetail(
      id,
      isDraftMode && draftKey ? { draftKey } : undefined
    )
  } catch {
    // エラー処理はhandleError内で完了しているためエラー自体は使用しない
    notFound()
  }

  return (
    <article className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* パンくずリスト */}
        <nav className="mb-6 text-sm">
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
          <h1 className="mb-4 mt-2 text-3xl font-bold">{news.title}</h1>
        </header>

        {/* 本文 */}
        <RichTextRenderer content={news.content} className="mb-12" />

        {/* 一覧に戻るリンク */}
        <div className="border-t pt-8">
          <Link
            href="/news"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            <svg
              className="mr-2 h-4 w-4"
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

        {/* プレビューモード時の終了リンク */}
        {isDraftMode && (
          <div className="fixed bottom-4 right-4 z-50">
            <Link
              href={`/api/exit-preview?redirect=/news/${id}`}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-red-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              プレビューモードを終了
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
