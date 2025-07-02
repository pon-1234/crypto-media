import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import SignupPage from '../page'
import { vi, describe, it, expect, beforeEach } from 'vitest'

/**
 * 新規登録ページのテスト
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

// モック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// fetchモック
global.fetch = vi.fn()

describe('SignupPage', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    })
  })

  it('サインアップフォームが正しくレンダリングされる', () => {
    render(<SignupPage />)

    expect(screen.getByText('新規アカウント登録')).toBeInTheDocument()
    expect(screen.getByLabelText('お名前')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'アカウントを作成' })
    ).toBeInTheDocument()
  })

  it('パスワード強度のリアルタイム検証が機能する', () => {
    render(<SignupPage />)

    const passwordInput = screen.getByLabelText('パスワード')

    // 弱いパスワードを入力
    fireEvent.change(passwordInput, { target: { value: 'weak' } })

    expect(
      screen.getByText('• パスワードは8文字以上で入力してください')
    ).toBeInTheDocument()
    expect(
      screen.getByText('• 大文字を1文字以上含めてください')
    ).toBeInTheDocument()
    expect(
      screen.getByText('• 数字を1文字以上含めてください')
    ).toBeInTheDocument()
    expect(
      screen.getByText('• 特殊文字を1文字以上含めてください')
    ).toBeInTheDocument()

    // 強いパスワードを入力
    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } })

    expect(
      screen.getByText('✓ パスワードは要件を満たしています')
    ).toBeInTheDocument()
  })

  it('パスワード確認の一致チェックが機能する', () => {
    render(<SignupPage />)

    const passwordInput = screen.getByLabelText('パスワード')
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）')

    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } })
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Different123!@#' },
    })

    expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
  })

  it('フォーム送信が成功した場合、ログインしてマイページに遷移する', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: '123', email: 'test@example.com', name: 'Test User' },
        message: 'アカウントが正常に作成されました',
      }),
    } as Response)
    vi.mocked(signIn).mockResolvedValueOnce({ error: null } as never)

    render(<SignupPage />)

    // フォームに入力
    fireEvent.change(screen.getByLabelText('お名前'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'Test123!@#' },
    })
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), {
      target: { value: 'Test123!@#' },
    })

    // フォームを送信
    fireEvent.click(screen.getByRole('button', { name: 'アカウントを作成' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        }),
      })
    })

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'Test123!@#',
        redirect: false,
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/media/mypage')
    })
  })

  it('メールアドレスが既に登録されている場合、エラーメッセージを表示する', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'このメールアドレスは既に登録されています',
      }),
    } as Response)

    render(<SignupPage />)

    // フォームに入力
    fireEvent.change(screen.getByLabelText('お名前'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'Test123!@#' },
    })
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), {
      target: { value: 'Test123!@#' },
    })

    // フォームを送信
    fireEvent.click(screen.getByRole('button', { name: 'アカウントを作成' }))

    await waitFor(() => {
      expect(
        screen.getByText('このメールアドレスは既に登録されています')
      ).toBeInTheDocument()
    })
  })

  it('送信中は入力フィールドとボタンが無効になる', async () => {
    // fetchを遅延させる
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))

    render(<SignupPage />)

    // フォームに入力
    fireEvent.change(screen.getByLabelText('お名前'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'Test123!@#' },
    })
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), {
      target: { value: 'Test123!@#' },
    })

    // フォームを送信
    fireEvent.click(screen.getByRole('button', { name: 'アカウントを作成' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '作成中...' })).toBeDisabled()
      expect(screen.getByLabelText('お名前')).toBeDisabled()
      expect(screen.getByLabelText('メールアドレス')).toBeDisabled()
      expect(screen.getByLabelText('パスワード')).toBeDisabled()
      expect(screen.getByLabelText('パスワード（確認）')).toBeDisabled()
    })
  })
})
