/**
 * 構造化データのProps
 */
interface StructuredDataProps {
  data: Record<string, unknown> & { '@type': string };
}

/**
 * JSON-LD形式の構造化データを出力するコンポーネント
 * @doc https://developers.google.com/search/docs/data-types/structured-data
 * @related src/components/seo/OrganizationSchema.tsx
 * @related src/components/seo/WebSiteSchema.tsx
 * @related src/components/seo/BreadcrumbSchema.tsx
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      id={`structured-data-${data['@type']}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}