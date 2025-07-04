import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'

/**
 * 用語集ページのメタデータ生成
 * @doc https://github.com/pon-1234/crypto-media/issues/37
 * @related getCorporatePageBySlug - microCMSからページデータ取得
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getCorporatePageBySlug('glossary')

  if (!page) {
    return {
      title: '用語集 | Crypto Media',
      description: '暗号資産・ブロックチェーンに関する用語集',
    }
  }

  return {
    title: `${page.title} | Crypto Media`,
    description: page.description || '暗号資産・ブロックチェーンに関する用語集',
    keywords: page.metadata?.keywords,
    openGraph: {
      title: `${page.title} | Crypto Media`,
      description:
        page.description || '暗号資産・ブロックチェーンに関する用語集',
      images: page.metadata?.ogImage ? [page.metadata.ogImage.url] : undefined,
    },
  }
}

/**
 * 用語集ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/37
 * @related getCorporatePageBySlug - microCMSからページデータ取得
 * @issue #37 - 静的コンテンツページの実装
 */
export default async function GlossaryPage() {
  const page = await getCorporatePageBySlug('glossary')

  if (!page) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">{page.title}</h1>

        {page.description && (
          <div className="mb-12 text-lg text-gray-600">
            <p>{page.description}</p>
          </div>
        )}

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {page.sections && page.sections.length > 0 && (
          <div className="mt-12 space-y-8">
            {page.sections.map((section, index) => (
              <section key={index} className="border-t pt-8">
                <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>

                {section.type === 'text' && (
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}

                {section.type === 'list' && (
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}

                {section.type === 'table' && (
                  <div
                    className="overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
