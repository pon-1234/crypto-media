import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import { generatePageMetadata } from '@/lib/metadata/generateMetadata'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { CorporatePageContent } from '@/components/corporate/CorporatePageContent'

/**
 * 事業内容ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/12
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
export default async function ServicePage() {
  const page = await getCorporatePageBySlug('service')

  if (!page) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">{page.title}</h1>
        <CorporatePageContent page={page} />
      </div>
    </main>
  )
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getCorporatePageBySlug('service')

  if (!page) {
    return {}
  }

  return generatePageMetadata({
    title: page.title,
    description: page.description || '',
    path: '/service',
    ogImage: page.metadata?.ogImage?.url,
    keywords: page.metadata?.keywords,
  })
}

/**
 * Revalidate every hour (ISR)
 */
export const revalidate = 3600
