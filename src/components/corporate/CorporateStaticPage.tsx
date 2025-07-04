import { notFound } from 'next/navigation'
import type { CorporatePage } from '@/lib/schema/corporate-page.schema'
import { CorporatePageContent } from '@/components/corporate/CorporatePageContent'

interface CorporateStaticPageProps {
  page: CorporatePage | null
}

/**
 * コーポレート静的ページの共通コンポーネント
 * @doc 利用規約、プライバシーポリシー、特定商取引法に基づく表記などの静的ページで使用
 * @related src/app/terms/page.tsx
 * @related src/app/privacy-policy/page.tsx
 * @related src/app/dealing/page.tsx
 */
export function CorporateStaticPage({ page }: CorporateStaticPageProps) {
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
