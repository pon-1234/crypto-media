/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileSettingsForm } from '../ProfileSettingsForm'

// Server Actionのモック
vi.mock('@/app/actions/account', () => ({
  updateProfile: vi.fn(),
}))

// toastのモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ProfileSettingsForm', () => {
  const defaultProps = {
    currentName: 'Test User',
    userId: 'test-user-id',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期値として現在の名前が表示される', () => {
    render(<ProfileSettingsForm {...defaultProps} />)
    const nameInput = screen.getByLabelText('表示名') as HTMLInputElement
    expect(nameInput.value).toBe('Test User')
  })

  it('名前を変更して送信できる', async () => {
    const user = userEvent.setup()
    const updateProfile = await import('@/app/actions/account').then(
      (m) => m.updateProfile
    )
    vi.mocked(updateProfile).mockResolvedValue({ success: true })

    render(<ProfileSettingsForm {...defaultProps} />)
    const nameInput = screen.getByLabelText('表示名')
    const submitButton = screen.getByRole('button', { name: '更新する' })

    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(submitButton)

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith('test-user-id', {
        name: 'New Name',
      })
    })
  })

  it('空の名前では送信できない', async () => {
    const user = userEvent.setup()
    render(<ProfileSettingsForm {...defaultProps} />)

    const nameInput = screen.getByLabelText('表示名')
    const submitButton = screen.getByRole('button', { name: '更新する' })

    await user.clear(nameInput)
    await user.click(submitButton)

    expect(screen.getByText('表示名を入力してください')).toBeInTheDocument()
  })

  it('50文字を超える名前では送信できない', async () => {
    const user = userEvent.setup()
    render(<ProfileSettingsForm {...defaultProps} />)

    const nameInput = screen.getByLabelText('表示名')
    const submitButton = screen.getByRole('button', { name: '更新する' })
    const longName = 'a'.repeat(51)

    await user.clear(nameInput)
    await user.type(nameInput, longName)
    await user.click(submitButton)

    expect(
      screen.getByText('表示名は50文字以内で入力してください')
    ).toBeInTheDocument()
  })

  it.skip('更新中はフォームが無効になる', async () => {
    const user = userEvent.setup()
    const updateProfile = await import('@/app/actions/account').then(
      (m) => m.updateProfile
    )

    // 遅延を設定して更新中の状態をテスト
    let resolvePromise: (
      value: { success: boolean } | { error: string }
    ) => void
    const promise = new Promise<{ success: boolean } | { error: string }>(
      (resolve) => {
        resolvePromise = resolve
      }
    )
    vi.mocked(updateProfile).mockReturnValue(promise)

    render(<ProfileSettingsForm {...defaultProps} />)
    const nameInput = screen.getByLabelText('表示名')
    const submitButton = screen.getByRole('button', { name: '更新する' })

    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')

    // フォーム送信を開始
    const submitPromise = user.click(submitButton)

    // 更新中の表示を確認
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '更新中...' })).toBeDisabled()
      expect(nameInput).toBeDisabled()
    })

    // 更新を完了させる
    resolvePromise!({ success: true })
    await submitPromise

    // 更新完了後の状態を確認
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '更新する' })).toBeEnabled()
      expect(nameInput).toBeEnabled()
    })
  })

  it('エラーが発生した場合はエラーメッセージを表示する', async () => {
    const user = userEvent.setup()
    const updateProfile = await import('@/app/actions/account').then(
      (m) => m.updateProfile
    )
    const toast = await import('sonner').then((m) => m.toast)

    vi.mocked(updateProfile).mockResolvedValue({
      error: 'プロフィールの更新に失敗しました',
    })

    render(<ProfileSettingsForm {...defaultProps} />)
    const nameInput = screen.getByLabelText('表示名')
    const submitButton = screen.getByRole('button', { name: '更新する' })

    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'プロフィールの更新に失敗しました'
      )
    })
  })

  it('成功した場合は成功メッセージを表示する', async () => {
    const user = userEvent.setup()
    const updateProfile = await import('@/app/actions/account').then(
      (m) => m.updateProfile
    )
    const toast = await import('sonner').then((m) => m.toast)

    vi.mocked(updateProfile).mockResolvedValue({ success: true })

    render(<ProfileSettingsForm {...defaultProps} />)
    const nameInput = screen.getByLabelText('表示名')
    const submitButton = screen.getByRole('button', { name: '更新する' })

    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('プロフィールを更新しました')
    })
  })
})
