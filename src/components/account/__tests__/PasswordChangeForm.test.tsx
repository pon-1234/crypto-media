/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordChangeForm } from '../PasswordChangeForm'
import { toast } from 'sonner'
import { changePassword } from '@/app/actions/account'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/app/actions/account', () => ({
  changePassword: vi.fn(),
}))

describe('PasswordChangeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('パスワード表示/非表示の切り替えができる', async () => {
    render(<PasswordChangeForm userId="test-user" />)

    const currentPasswordInput = screen.getByLabelText('現在のパスワード')
    const newPasswordInput = screen.getByLabelText('新しいパスワード')
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

    // 初期状態では非表示
    expect(currentPasswordInput).toHaveAttribute('type', 'password')
    expect(newPasswordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')

    // 表示切り替えボタンをクリック
    const toggleButtons = screen.getAllByRole('button', { name: '' })
    await userEvent.click(toggleButtons[0])
    await userEvent.click(toggleButtons[1])
    await userEvent.click(toggleButtons[2])

    // パスワードが表示される
    expect(currentPasswordInput).toHaveAttribute('type', 'text')
    expect(newPasswordInput).toHaveAttribute('type', 'text')
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')
  })

  it('新しいパスワードが一致しない場合、エラーを表示する', async () => {
    render(<PasswordChangeForm userId="test-user" />)

    await userEvent.type(
      screen.getByLabelText('現在のパスワード'),
      'currentPassword123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード'),
      'newPassword123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード（確認）'),
      'differentPassword123'
    )

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('新しいパスワードが一致しません')
    })
  })

  it('フォーム送信が成功した場合、成功メッセージを表示する', async () => {
    vi.mocked(changePassword).mockResolvedValueOnce({ success: true })
    render(<PasswordChangeForm userId="test-user" />)

    await userEvent.type(
      screen.getByLabelText('現在のパスワード'),
      'currentPassword123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード'),
      'newPassword123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード（確認）'),
      'newPassword123'
    )

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith('test-user', {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      })
      expect(toast.success).toHaveBeenCalledWith('パスワードを変更しました')
    })
  })

  it('現在のパスワードが間違っている場合、APIからのエラーメッセージを表示する', async () => {
    vi.mocked(changePassword).mockResolvedValueOnce({ error: '現在のパスワードが違います' })
    render(<PasswordChangeForm userId="test-user" />)

    await userEvent.type(
      screen.getByLabelText('現在のパスワード'),
      'wrongPassword'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード'),
      'newPassword123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード（確認）'),
      'newPassword123'
    )

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('現在のパスワードが違います')
    })
  })

  it('全てのフィールドが空の場合、エラーを表示する', async () => {
    render(<PasswordChangeForm userId="test-user" />)

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('すべての項目を入力してください')
    })
  })

  it('パスワードが短すぎる場合、エラーを表示する', async () => {
    render(<PasswordChangeForm userId="test-user" />)

    await userEvent.type(
      screen.getByLabelText('現在のパスワード'),
      'current123'
    )
    await userEvent.type(screen.getByLabelText('新しいパスワード'), 'short')
    await userEvent.type(
      screen.getByLabelText('新しいパスワード（確認）'),
      'short'
    )

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'パスワードは8文字以上で入力してください'
      )
    })
  })

  it('パスワードに英数字が含まれない場合、エラーを表示する', async () => {
    render(<PasswordChangeForm userId="test-user" />)

    await userEvent.type(
      screen.getByLabelText('現在のパスワード'),
      'current123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード'),
      'aaaaaaaa'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード（確認）'),
      'aaaaaaaa'
    )

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'パスワードは英数字を含む必要があります'
      )
    })
  })

  it('現在のパスワードと新しいパスワードが同じ場合、エラーを表示する', async () => {
    render(<PasswordChangeForm userId="test-user" />)

    await userEvent.type(
      screen.getByLabelText('現在のパスワード'),
      'samePassword123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード'),
      'samePassword123'
    )
    await userEvent.type(
      screen.getByLabelText('新しいパスワード（確認）'),
      'samePassword123'
    )

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        '新しいパスワードは現在のパスワードと異なる必要があります'
      )
    })
  })
})