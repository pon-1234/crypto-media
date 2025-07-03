import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { generatePageMetadata } from '@/lib/metadata/generateMetadata'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { CorporatePageContent } from '@/components/corporate/CorporatePageContent'

/**
 * 利用規約ページ
 * @doc サービスの利用条件、会員規約、免責事項を記載
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
export default async function TermsPage() {
  const page = await getCorporatePageBySlug('terms')

  if (!page) {
    notFound()
  }
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1 className="mb-8 text-4xl font-bold">{page.title}</h1>
        <CorporatePageContent page={page} />
      </div>
    </main>
  )
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getCorporatePageBySlug('terms')

  if (!page) {
    return {}
  }

  return generatePageMetadata({
    title: page.title,
    description: page.description || '',
    path: '/terms',
    ogImage: page.metadata?.ogImage?.url,
    keywords: page.metadata?.keywords,
  })
}

/**
 * Revalidate every hour (ISR)
 */
export const revalidate = 3600
