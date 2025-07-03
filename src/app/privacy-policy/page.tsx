import type { Metadata } from 'next'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { CorporateStaticPage } from '@/components/corporate/CorporateStaticPage'
import { generateStaticPageMetadata } from '@/lib/corporate/generateStaticPageMetadata'

/**
 * プライバシーポリシーページ
 * @doc 個人情報の取扱い、利用目的、安全管理措置を記載
 * @issue #12 - コーポレート静的ページの実装
 * @issue #25 - コーポレートページのCMS化
 */
export default async function PrivacyPolicyPage() {
  const page = await getCorporatePageBySlug('privacy-policy')
  return <CorporateStaticPage page={page} />
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  return generateStaticPageMetadata('privacy-policy', '/privacy-policy')
}

/**
 * Revalidate every hour (ISR)
 */
export const revalidate = 3600
