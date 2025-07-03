import type { Metadata } from 'next'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { CorporateStaticPage } from '@/components/corporate/CorporateStaticPage'
import { generateStaticPageMetadata } from '@/lib/corporate/generateStaticPageMetadata'

/**
 * 特定商取引法に基づく表記ページ
 * @doc 販売業者の情報、支払い方法、返品・キャンセルポリシーなどを記載
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
export default async function DealingPage() {
  const page = await getCorporatePageBySlug('dealing')
  return <CorporateStaticPage page={page} />
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  return generateStaticPageMetadata('dealing', '/dealing')
}

/**
 * Revalidate every hour (ISR)
 */
export const revalidate = 3600