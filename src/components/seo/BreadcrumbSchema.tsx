import { StructuredData } from './StructuredData'

/**
 * パンくずリストの項目
 */
export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * BreadcrumbSchemaのProps
 */
interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

/**
 * BreadcrumbList構造化データを生成するコンポーネント
 * @doc https://schema.org/BreadcrumbList
 * @related src/components/common/Breadcrumb.tsx
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crypto-media.jp'

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return <StructuredData data={breadcrumbData} />
}
