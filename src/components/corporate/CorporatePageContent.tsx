/**
 * @doc Corporate page content renderer component
 * @related /about, /service, /privacy-policy, /terms pages
 * @issue https://github.com/pon-1234/crypto-media/issues/25
 */
import { type CorporatePage } from '@/lib/schema/corporate-page.schema'
import { sanitizeHtml } from '@/lib/utils/sanitize'

interface CorporatePageContentProps {
  page: CorporatePage
}

/**
 * Renders corporate page content with support for sections
 */
export function CorporatePageContent({ page }: CorporatePageContentProps) {
  if (page.sections && page.sections.length > 0) {
    return (
      <div className="space-y-12">
        {page.sections.map((section, index) => (
          <section key={index}>
            <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
            {renderSectionContent(section)}
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="prose prose-gray max-w-none">
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
    </div>
  )
}

/**
 * Render section content based on type
 */
function renderSectionContent(section: NonNullable<CorporatePage['sections']>[0]) {
  switch (section.type) {
    case 'text':
      return (
        <div 
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }} 
        />
      )
    
    case 'list':
      return (
        <div 
          className="prose prose-gray max-w-none prose-ul:list-disc prose-ul:list-inside"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }} 
        />
      )
    
    case 'table':
      return (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div 
            className="prose prose-gray max-w-none prose-table:w-full prose-th:bg-gray-50 prose-th:text-left prose-th:font-medium prose-td:border-b prose-td:border-gray-200"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }} 
          />
        </div>
      )
    
    default:
      return (
        <div 
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }} 
        />
      )
  }
}