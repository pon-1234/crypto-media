/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import SupportPage from '../page'

// lucide-reactのモック
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react')
  return {
    ...actual,
    ChevronLeft: () => <div data-testid="chevron-left" />,
    ChevronRight: () => <div data-testid="chevron-right" />,
    Mail: () => <div data-testid="mail-icon" />,
    MessageCircle: () => <div data-testid="message-circle-icon" />,
    Book: () => <div data-testid="book-icon" />,
  }
})

describe('SupportPage', () => {
  it('ページが正しくレンダリングされる', () => {
    const { container } = render(<SupportPage />)
    expect(container).toMatchSnapshot()
  })
}) 