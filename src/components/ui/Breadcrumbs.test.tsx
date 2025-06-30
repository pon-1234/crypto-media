import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders breadcrumb items correctly', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Current Page' },
    ]

    render(<Breadcrumbs items={items} />)

    // Check all items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Current Page')).toBeInTheDocument()
  })

  it('renders links for all items except the last one', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Current Page' },
    ]

    render(<Breadcrumbs items={items} />)

    // First two items should be links
    const homeLink = screen.getByRole('link', { name: 'Home' })
    expect(homeLink).toHaveAttribute('href', '/')

    const categoryLink = screen.getByRole('link', { name: 'Category' })
    expect(categoryLink).toHaveAttribute('href', '/category')

    // Last item should not be a link
    const currentPage = screen.getByText('Current Page')
    expect(currentPage.tagName).not.toBe('A')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
  })

  it('renders separators between items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Current Page' },
    ]

    const { container } = render(<Breadcrumbs items={items} />)

    // Should have 2 separators (for 3 items)
    const separators = container.querySelectorAll('svg')
    expect(separators).toHaveLength(2)
  })

  it('applies custom className', () => {
    const items = [{ label: 'Home', href: '/' }]
    const { container } = render(
      <Breadcrumbs items={items} className="custom-class" />
    )

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('custom-class')
  })

  it('handles single item without href', () => {
    const items = [{ label: 'Single Page' }]
    render(<Breadcrumbs items={items} />)

    const singleItem = screen.getByText('Single Page')
    expect(singleItem).toBeInTheDocument()
    expect(singleItem.tagName).not.toBe('A')
  })

  it('has proper accessibility attributes', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Current' },
    ]

    render(<Breadcrumbs items={items} />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', 'パンくずリスト')
  })
})