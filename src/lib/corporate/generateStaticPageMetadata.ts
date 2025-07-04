import type { Metadata } from 'next'
import { getCorporatePageBySlug } from '@/lib/microcms/corporate-pages'
import { generatePageMetadata } from '@/lib/metadata/generateMetadata'

/**
 * コーポレート静的ページのメタデータを生成する共通関数
 * @param slug - ページのスラッグ
 * @param path - ページのパス
 * @returns メタデータ
 */
export async function generateStaticPageMetadata(
  slug: string,
  path: string
): Promise<Metadata> {
  const page = await getCorporatePageBySlug(slug)

  if (!page) {
    return {}
  }

  return generatePageMetadata({
    title: page.title,
    description: page.description || '',
    path,
    ogImage: page.metadata?.ogImage?.url,
    keywords: page.metadata?.keywords,
  })
}
