import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CorporatePageContent } from './CorporatePageContent'
import { type CorporatePage } from '@/lib/schema/corporate-page.schema'

// Mock the sanitize utility
vi.mock('@/lib/utils/sanitize', () => ({
  sanitizeHtml: vi.fn((html: string) => html), // Pass through for testing
}))

describe('CorporatePageContent', () => {
  const basePage: CorporatePage = {
    id: 'test-id',
    slug: 'test',
    title: 'Test Page',
    description: 'Test description',
    content: '<p>Test content</p>',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }

  it('should render simple content when no sections', () => {
    render(<CorporatePageContent page={basePage} />)

    const content = screen.getByText('Test content')
    expect(content).toBeInTheDocument()
  })

  it('should render sections when provided', () => {
    const pageWithSections: CorporatePage = {
      ...basePage,
      sections: [
        {
          title: 'Text Section',
          content: '<p>This is text content</p>',
          type: 'text',
        },
        {
          title: 'List Section',
          content: '<ul><li>Item 1</li><li>Item 2</li></ul>',
          type: 'list',
        },
      ],
    }

    render(<CorporatePageContent page={pageWithSections} />)

    expect(screen.getByText('Text Section')).toBeInTheDocument()
    expect(screen.getByText('This is text content')).toBeInTheDocument()
    expect(screen.getByText('List Section')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('should render table sections with proper styling', () => {
    const pageWithTable: CorporatePage = {
      ...basePage,
      sections: [
        {
          title: 'Table Section',
          content: '<table><tr><th>Header</th><td>Data</td></tr></table>',
          type: 'table',
        },
      ],
    }

    render(<CorporatePageContent page={pageWithTable} />)

    expect(screen.getByText('Table Section')).toBeInTheDocument()
    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Data')).toBeInTheDocument()

    const tableContainer = screen
      .getByText('Header')
      .closest('div')?.parentElement
    expect(tableContainer).toHaveClass(
      'overflow-hidden',
      'rounded-lg',
      'border',
      'border-gray-200'
    )
  })

  it('should handle mixed section types', () => {
    const pageWithMixedSections: CorporatePage = {
      ...basePage,
      sections: [
        {
          title: 'About Us',
          content: '<p>We are a company...</p>',
          type: 'text',
        },
        {
          title: 'Services',
          content: '<ul><li>Service A</li><li>Service B</li></ul>',
          type: 'list',
        },
        {
          title: 'Company Info',
          content: '<table><tr><th>Founded</th><td>2023</td></tr></table>',
          type: 'table',
        },
      ],
    }

    render(<CorporatePageContent page={pageWithMixedSections} />)

    expect(screen.getByText('About Us')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Company Info')).toBeInTheDocument()
    expect(screen.getByText('We are a company...')).toBeInTheDocument()
    expect(screen.getByText('Service A')).toBeInTheDocument()
    expect(screen.getByText('Founded')).toBeInTheDocument()
  })

  it('should handle empty sections array', () => {
    const pageWithEmptySections: CorporatePage = {
      ...basePage,
      sections: [],
    }

    render(<CorporatePageContent page={pageWithEmptySections} />)

    // Should fall back to rendering the main content
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should sanitize content before rendering', async () => {
    const { sanitizeHtml } = await import('@/lib/utils/sanitize')

    render(<CorporatePageContent page={basePage} />)

    expect(vi.mocked(sanitizeHtml)).toHaveBeenCalledWith('<p>Test content</p>')
  })

  it('should sanitize section content', async () => {
    const { sanitizeHtml } = await import('@/lib/utils/sanitize')

    const pageWithSections: CorporatePage = {
      ...basePage,
      sections: [
        {
          title: 'Test',
          content: '<script>alert("XSS")</script><p>Safe content</p>',
          type: 'text',
        },
      ],
    }

    render(<CorporatePageContent page={pageWithSections} />)

    expect(vi.mocked(sanitizeHtml)).toHaveBeenCalledWith(
      '<script>alert("XSS")</script><p>Safe content</p>'
    )
  })
})
