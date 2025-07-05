/**
 * error.tsx の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../error'

// console.errorをモック
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('ErrorBoundary', () => {
  const mockError = new Error('テストエラー') as Error & { digest?: string }
  mockError.digest = 'test-digest-123'
  const mockReset = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('エラーメッセージが表示される', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(
      screen.getByText('申し訳ございません。予期しないエラーが発生しました。')
    ).toBeInTheDocument()
  })

  it('エラーアイコンが表示される', () => {
    const { container } = render(
      <ErrorBoundary error={mockError} reset={mockReset} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-12', 'h-12', 'text-red-600')
  })

  it('「もう一度試す」ボタンが機能する', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)

    const retryButton = screen.getByRole('button', { name: 'もう一度試す' })
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('トップページへのリンクが表示される', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)

    const homeLink = screen.getByRole('link', { name: 'トップページへ戻る' })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('お問い合わせリンクが表示される', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)

    const contactLink = screen.getByRole('link', { name: 'お問い合わせ' })
    expect(contactLink).toBeInTheDocument()
    expect(contactLink).toHaveAttribute('href', '/contact/')
  })

  it('エラーがコンソールに記録される', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error boundary caught:',
      mockError
    )
  })

  it('開発環境でエラーIDが表示される', () => {
    vi.stubEnv('NODE_ENV', 'development')

    render(<ErrorBoundary error={mockError} reset={mockReset} />)

    expect(screen.getByText('Error ID: test-digest-123')).toBeInTheDocument()

    vi.unstubAllEnvs()
  })

  it('本番環境でエラーIDが表示されない', () => {
    vi.stubEnv('NODE_ENV', 'production')

    render(<ErrorBoundary error={mockError} reset={mockReset} />)

    expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument()

    vi.unstubAllEnvs()
  })
})
