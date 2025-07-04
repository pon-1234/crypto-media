/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SupportPage from '../page'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

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

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const mockedGetServerSession = vi.mocked(getServerSession)

describe('SupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('セッションがない場合、リダイレクトする', async () => {
    mockedGetServerSession.mockResolvedValue(null)
    try {
      await SupportPage()
    } catch {
      // redirectが内部でエラーをスローするためキャッチ
    }
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('ページが正しくレンダリングされる', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
      expires: '2025-01-01T00:00:00Z',
    })

    // 非同期コンポーネントを解決するためにawaitを使用
    const ResolvedComponent = await SupportPage()
    render(ResolvedComponent)

    expect(
      screen.getByRole('heading', { name: 'サポート', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'ご不明な点や問題がございましたら、下記よりお問い合わせください。',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'お問い合わせフォーム' }),
    ).toHaveAttribute('href', '/media/contact')
  })
}) 