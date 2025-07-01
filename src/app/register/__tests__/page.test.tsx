import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '../page'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('RegisterPage', () => {
  const mockPush = vi.fn()
  const mockSession = {
    user: {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2025-08-15',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    } as ReturnType<typeof useRouter>)
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      }),
    } as Response)
  })

  it('renders the registration page with plan details', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    render(<RegisterPage />)

    expect(screen.getByText('有料会員登録')).toBeInTheDocument()
    expect(screen.getByText('¥1,980')).toBeInTheDocument()
    expect(
      screen.getByText('有料限定記事への無制限アクセス')
    ).toBeInTheDocument()
    expect(
      screen.getByText('調査レポート・分析記事の全文閲覧')
    ).toBeInTheDocument()
    expect(screen.getByText('新着記事の早期アクセス')).toBeInTheDocument()
    expect(screen.getByText('広告非表示')).toBeInTheDocument()
  })

  it('shows login prompt when user is not authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    render(<RegisterPage />)

    expect(
      screen.getByText('有料会員登録にはログインが必要です')
    ).toBeInTheDocument()
    expect(screen.getByText('ログインして続ける')).toBeInTheDocument()
  })

  it('shows loading state while checking session', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    })

    const { container } = render(<RegisterPage />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('redirects to login when clicking checkout without session', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    render(<RegisterPage />)

    const loginButton = screen.getByText('ログインして続ける')
    expect(loginButton).toHaveAttribute('href', '/login?redirect=/register')
  })

  it('creates checkout session when authenticated user clicks register', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    })

    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })

    render(<RegisterPage />)

    const registerButton = screen.getByText('今すぐ登録する')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    })

    await waitFor(() => {
      expect(mockLocation.href).toBe(
        'https://checkout.stripe.com/pay/cs_test_123'
      )
    })
  })

  it('shows error message when checkout session creation fails', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    })
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'サーバーエラーが発生しました' }),
    } as Response)

    render(<RegisterPage />)

    const registerButton = screen.getByText('今すぐ登録する')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(
        screen.getByText('サーバーエラーが発生しました')
      ).toBeInTheDocument()
    })
  })

  it('shows generic error message on unexpected error', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    })
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

    render(<RegisterPage />)

    const registerButton = screen.getByText('今すぐ登録する')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('disables button while processing', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    })

    // Simulate slow response
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  url: 'https://checkout.stripe.com/pay/cs_test_123',
                }),
              } as Response),
            100
          )
        )
    )

    render(<RegisterPage />)

    const registerButton = screen.getByText('今すぐ登録する')
    fireEvent.click(registerButton)

    expect(registerButton).toBeDisabled()
    expect(screen.getByText('処理中...')).toBeInTheDocument()
  })

  it('shows links to terms and privacy policy', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    render(<RegisterPage />)

    const termsLink = screen.getByRole('link', { name: '利用規約' })
    const privacyLink = screen.getByRole('link', {
      name: 'プライバシーポリシー',
    })

    expect(termsLink).toHaveAttribute('href', '/terms')
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
  })
})
