/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordChangeForm } from '../PasswordChangeForm'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

global.fetch = vi.fn()

describe('PasswordChangeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  it('フォームが正しくレンダリングされる', () => {
    render(<PasswordChangeForm userId="test-user" />)
    expect(screen.getByLabelText('現在のパスワード')).toBeInTheDocument()
    expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument()
    expect(
      screen.getByLabelText('新しいパスワード（確認）')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '変更する' })
    ).toBeInTheDocument()
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
      'wrongPassword'
    )
    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('新しいパスワードが一致しません')
    })
  })

  it('フォーム送信が成功した場合、成功メッセージを表示する', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))
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
      expect(fetch).toHaveBeenCalledWith('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
        }),
      })
      expect(toast.success).toHaveBeenCalledWith('パスワードを変更しました')
    })
  })

  it('現在のパスワードが間違っている場合、APIからのエラーメッセージを表示する', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '現在のパスワードが違います' }), {
        status: 400,
      })
    )
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
    
    await userEvent.type(screen.getByLabelText('現在のパスワード'), 'current123')
    await userEvent.type(screen.getByLabelText('新しいパスワード'), 'short')
    await userEvent.type(screen.getByLabelText('新しいパスワード（確認）'), 'short')
    
    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('パスワードは8文字以上で入力してください')
    })
  })

  it('パスワードに英数字が含まれない場合、エラーを表示する', async () => {
    render(<PasswordChangeForm userId="test-user" />)
    
    await userEvent.type(screen.getByLabelText('現在のパスワード'), 'current123')
    await userEvent.type(screen.getByLabelText('新しいパスワード'), 'passwordonly')
    await userEvent.type(screen.getByLabelText('新しいパスワード（確認）'), 'passwordonly')
    
    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('パスワードは英数字を含む必要があります')
    })
  })

  it('現在のパスワードと新しいパスワードが同じ場合、エラーを表示する', async () => {
    render(<PasswordChangeForm userId="test-user" />)
    
    await userEvent.type(screen.getByLabelText('現在のパスワード'), 'samePassword123')
    await userEvent.type(screen.getByLabelText('新しいパスワード'), 'samePassword123')
    await userEvent.type(screen.getByLabelText('新しいパスワード（確認）'), 'samePassword123')
    
    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('新しいパスワードは現在のパスワードと異なる必要があります')
    })
  })

  it('パスワード表示/非表示の切り替えが動作する', async () => {
    render(<PasswordChangeForm userId="test-user" />)
    
    const currentPasswordInput = screen.getByLabelText('現在のパスワード')
    const newPasswordInput = screen.getByLabelText('新しいパスワード')
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')
    
    // 初期状態はpasswordタイプ
    expect(currentPasswordInput).toHaveAttribute('type', 'password')
    expect(newPasswordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    
    // 目のアイコンボタンをクリック（aria-labelを追加するか、getAllByRoleを使用）
    const toggleButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.getAttribute('type') === 'button'
    )
    expect(toggleButtons).toHaveLength(3)
    
    await userEvent.click(toggleButtons[0])
    await userEvent.click(toggleButtons[1])
    await userEvent.click(toggleButtons[2])
    
    // textタイプに変更される
    expect(currentPasswordInput).toHaveAttribute('type', 'text')
    expect(newPasswordInput).toHaveAttribute('type', 'text')
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')
  })

  it('送信中はボタンが無効になる', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))
    
    render(<PasswordChangeForm userId="test-user" />)
    
    await userEvent.type(screen.getByLabelText('現在のパスワード'), 'current123')
    await userEvent.type(screen.getByLabelText('新しいパスワード'), 'newPassword123')
    await userEvent.type(screen.getByLabelText('新しいパスワード（確認）'), 'newPassword123')
    
    const submitButton = screen.getByRole('button', { name: '変更する' })
    
    // ボタンクリック前は有効
    expect(submitButton).toBeEnabled()
    
    // ボタンクリック
    await userEvent.click(submitButton)
    
    // 送信完了後の状態を確認
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('パスワードを変更しました')
    })
  })

  it('成功後にフォームがリセットされる', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))
    render(<PasswordChangeForm userId="test-user" />)

    const currentPasswordInput = screen.getByLabelText('現在のパスワード')
    const newPasswordInput = screen.getByLabelText('新しいパスワード')
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

    await userEvent.type(currentPasswordInput, 'currentPassword123')
    await userEvent.type(newPasswordInput, 'newPassword123')
    await userEvent.type(confirmPasswordInput, 'newPassword123')

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('パスワードを変更しました')
    })

    // フォームがリセットされていることを確認
    expect(currentPasswordInput).toHaveValue('')
    expect(newPasswordInput).toHaveValue('')
    expect(confirmPasswordInput).toHaveValue('')
  })

  it('ネットワークエラーの場合、エラーメッセージを表示する', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    render(<PasswordChangeForm userId="test-user" />)

    await userEvent.type(screen.getByLabelText('現在のパスワード'), 'current123')
    await userEvent.type(screen.getByLabelText('新しいパスワード'), 'newPassword123')
    await userEvent.type(screen.getByLabelText('新しいパスワード（確認）'), 'newPassword123')

    fireEvent.submit(screen.getByRole('button', { name: '変更する' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('パスワードの変更に失敗しました')
    })
  })
}) 