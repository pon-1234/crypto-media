import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import ResetPasswordPage from '../page'
import { vi, describe, it, expect, beforeEach } from 'vitest'

/**
 * パスワードリセットページのテスト
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

// モック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// fetchモック
global.fetch = vi.fn() as any

describe('ResetPasswordPage', () => {
  const mockPush = vi.fn()
  const mockGet = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any)
  })

  describe('トークンなしの場合（パスワードリセット要求）', () => {
    beforeEach(() => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: mockGet.mockReturnValue(null),
      } as any)
    })

    it('パスワードリセット要求フォームが表示される', () => {
      render(<ResetPasswordPage />)

      expect(screen.getByText('パスワードをリセット')).toBeInTheDocument()
      expect(screen.getByText('登録したメールアドレスを入力してください')).toBeInTheDocument()
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'リセットメールを送信' })).toBeInTheDocument()
    })

    it('メールアドレスを入力してリセット要求を送信できる', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）',
        }),
      } as any)

      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText('メールアドレス')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      })

      await waitFor(() => {
        expect(screen.getByText('パスワードリセットのメールを送信しました。メールをご確認ください。')).toBeInTheDocument()
      })
    })

    it('エラーメッセージが表示される', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: '予期しないエラーが発生しました',
        }),
      } as any)

      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText('メールアドレス')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('予期しないエラーが発生しました')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('トークンありの場合（パスワード設定）', () => {
    beforeEach(() => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: mockGet.mockReturnValue('reset-token-123'),
      } as any)
    })

    it('パスワード設定フォームが表示される', () => {
      render(<ResetPasswordPage />)

      expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument()
      expect(screen.getByText('新しいパスワードを入力してください')).toBeInTheDocument()
      expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument()
      expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'パスワードを更新' })).toBeInTheDocument()
    })

    it('パスワード強度のリアルタイム検証が機能する', () => {
      render(<ResetPasswordPage />)

      const passwordInput = screen.getByLabelText('新しいパスワード')

      // 弱いパスワードを入力
      fireEvent.change(passwordInput, { target: { value: 'weak' } })

      expect(screen.getByText('• パスワードは8文字以上で入力してください')).toBeInTheDocument()
      expect(screen.getByText('• 大文字を1文字以上含めてください')).toBeInTheDocument()
      expect(screen.getByText('• 数字を1文字以上含めてください')).toBeInTheDocument()
      expect(screen.getByText('• 特殊文字を1文字以上含めてください')).toBeInTheDocument()

      // 強いパスワードを入力
      fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } })

      expect(screen.getByText('✓ パスワードは要件を満たしています')).toBeInTheDocument()
    })

    it('パスワード確認の一致チェックが機能する', () => {
      render(<ResetPasswordPage />)

      const passwordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('パスワード（確認）')

      fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123!@#' } })

      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    })

    it('新しいパスワードを設定できる', async () => {
      // タイマーのモック
      vi.useFakeTimers()
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'パスワードが正常に更新されました',
        }),
      } as any)

      render(<ResetPasswordPage />)

      const passwordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('パスワード（確認）')

      fireEvent.change(passwordInput, { target: { value: 'NewTest123!@#' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewTest123!@#' } })

      const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: 'reset-token-123',
            password: 'NewTest123!@#',
          }),
        })
      })

      await waitFor(() => {
        expect(screen.getByText('パスワードが正常にリセットされました。ログインページに移動します...')).toBeInTheDocument()
      })

      // 3秒後にログインページに遷移することを確認
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })

      vi.useRealTimers()
    })

    it('パスワードが一致しない場合、エラーが表示される', async () => {
      render(<ResetPasswordPage />)

      const passwordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('パスワード（確認）')

      fireEvent.change(passwordInput, { target: { value: 'NewTest123!@#' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123!@#' } })

      const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })
      fireEvent.click(submitButton)

      // フォーム送信後のエラー表示を待つ
      await waitFor(() => {
        expect(screen.getAllByText('パスワードが一致しません').length).toBeGreaterThan(0)
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('送信中は入力フィールドとボタンが無効になる', async () => {
      // fetchを遅延させる
      vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))

      render(<ResetPasswordPage />)

      const passwordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('パスワード（確認）')

      fireEvent.change(passwordInput, { target: { value: 'NewTest123!@#' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewTest123!@#' } })

      const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '更新中...' })).toBeDisabled()
        expect(passwordInput).toBeDisabled()
        expect(confirmPasswordInput).toBeDisabled()
      })
    })
  })
})