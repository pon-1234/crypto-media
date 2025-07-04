import type { Metadata } from 'next'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { CorporateStaticPage } from '@/components/corporate/CorporateStaticPage'
import { generateStaticPageMetadata } from '@/lib/corporate/generateStaticPageMetadata'

/**
 * 利用規約ページ
 * @doc サービスの利用条件、会員規約、免責事項を記載
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
export default async function TermsPage() {
  const page = await getCorporatePageBySlug('terms')
  return <CorporateStaticPage page={page} />
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  return generateStaticPageMetadata('terms', '/terms')
}

/**
 * Revalidate every hour (ISR)
 */
export const revalidate = 3600
