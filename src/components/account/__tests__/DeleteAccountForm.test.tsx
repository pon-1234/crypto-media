/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteAccountForm } from '../DeleteAccountForm'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import { deleteAccount } from '@/app/actions/account'

// モックの設定
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))
vi.mock('@/app/actions/account', () => ({
  deleteAccount: vi.fn(),
}))

global.fetch = vi.fn()

describe('DeleteAccountForm', () => {
  const defaultProps = {
    userId: 'test-user',
    userEmail: 'test@example.com',
    hasPaidMembership: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  it('メールアドレスが一致しない場合、削除ボタンは無効', () => {
    render(<DeleteAccountForm {...defaultProps} />)
    expect(
      screen.getByRole('button', { name: 'アカウントを削除する' })
    ).toBeDisabled()
  })

  it('メールアドレスと確認テキストが一致すると、削除ボタンが有効になる', async () => {
    render(<DeleteAccountForm {...defaultProps} />)
    const emailInput = screen.getByLabelText(/確認のため、登録メールアドレスを入力してください/)
    const textInput = screen.getByLabelText(/「削除する」と入力してください/)
    const passwordInput = screen.getByLabelText(/パスワード/)

    await userEvent.type(emailInput, defaultProps.userEmail)
    await userEvent.type(textInput, '削除する')
    await userEvent.type(passwordInput, 'testpassword')

    expect(
      screen.getByRole('button', { name: 'アカウントを削除する' })
    ).toBeEnabled()
  })

  it('アカウント削除に成功すると、サインアウトしてリダイレクトする', async () => {
    vi.mocked(deleteAccount).mockResolvedValueOnce({ success: true })
    render(<DeleteAccountForm {...defaultProps} />)

    const emailInput = screen.getByLabelText(/確認のため、登録メールアドレスを入力してください/)
    const textInput = screen.getByLabelText(/「削除する」と入力してください/)
    const passwordInput = screen.getByLabelText(/パスワード/)
    await userEvent.type(emailInput, defaultProps.userEmail)
    await userEvent.type(textInput, '削除する')
    await userEvent.type(passwordInput, 'testpassword')
    fireEvent.click(
      screen.getByRole('button', { name: 'アカウントを削除する' })
    )

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledWith('test-user', {
        password: 'testpassword',
        reason: '',
        hasPaidMembership: false,
      })
      expect(toast.success).toHaveBeenCalledWith('アカウントを削除しました')
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })
  })

  it('アカウント削除に失敗した場合、エラーメッセージを表示する', async () => {
    vi.mocked(deleteAccount).mockResolvedValueOnce({ error: 'カスタムエラー' })
    render(<DeleteAccountForm {...defaultProps} />)

    const emailInput = screen.getByLabelText(/確認のため、登録メールアドレスを入力してください/)
    const textInput = screen.getByLabelText(/「削除する」と入力してください/)
    const passwordInput = screen.getByLabelText(/パスワード/)
    await userEvent.type(emailInput, defaultProps.userEmail)
    await userEvent.type(textInput, '削除する')
    await userEvent.type(passwordInput, 'testpassword')
    fireEvent.click(
      screen.getByRole('button', { name: 'アカウントを削除する' })
    )

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('カスタムエラー')
    })
  })

  it('有料会員の場合、警告メッセージが表示される', () => {
    render(<DeleteAccountForm {...defaultProps} hasPaidMembership={true} />)

    // 警告メッセージが表示されることを確認
    expect(
      screen.getByText(
        '有料会員プランは自動的に解約され、日割り計算による返金は行われません'
      )
    ).toBeInTheDocument()
  })

  it('ネットワークエラーの場合、エラーメッセージを表示する', async () => {
    vi.mocked(deleteAccount).mockRejectedValueOnce(new Error('Network error'))
    render(<DeleteAccountForm {...defaultProps} />)

    const emailInput = screen.getByLabelText(/確認のため、登録メールアドレスを入力してください/)
    const textInput = screen.getByLabelText(/「削除する」と入力してください/)
    const passwordInput = screen.getByLabelText(/パスワード/)
    await userEvent.type(emailInput, defaultProps.userEmail)
    await userEvent.type(textInput, '削除する')
    await userEvent.type(passwordInput, 'testpassword')
    fireEvent.click(
      screen.getByRole('button', { name: 'アカウントを削除する' })
    )

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('アカウントの削除に失敗しました')
    })
  })

})
