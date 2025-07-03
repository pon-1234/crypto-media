/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileSettingsForm } from '../ProfileSettingsForm'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// useRouterとtoastのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// fetchのモック
global.fetch = vi.fn()

describe('ProfileSettingsForm', () => {
  const defaultProps = {
    initialName: 'Test User',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  it('送信ボタンが初期状態では無効になっている', () => {
    render(<ProfileSettingsForm {...defaultProps} />)
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' })
    expect(submitButton).toBeDisabled()
  })

  it('名前を変更すると送信ボタンが有効になる', async () => {
    render(<ProfileSettingsForm {...defaultProps} />)
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' })
    const nameInput = screen.getByLabelText('名前')
    
    await userEvent.type(nameInput, ' updated')
    expect(submitButton).toBeEnabled()
  })

  it('送信中の処理をシミュレート', async () => {
    // 長時間のレスポンスをシミュレート
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise((resolve) => {
        setTimeout(() => {
          resolve(new Response(null, { status: 200 }))
        }, 1000)
      })
    )
    
    render(<ProfileSettingsForm {...defaultProps} />)
    
    const nameInput = screen.getByLabelText('名前')
    await userEvent.type(nameInput, ' updated')
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' })
    
    // フォーム送信
    await userEvent.click(submitButton)
    
    // fetchが呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User updated' }),
    })
  })

  it('初期値が正しく表示される', () => {
    render(<ProfileSettingsForm {...defaultProps} />)
    expect(screen.getByLabelText('名前')).toHaveValue(defaultProps.initialName)
    expect(screen.getByLabelText('メールアドレス')).toHaveValue(defaultProps.email)
    expect(screen.getByLabelText('メールアドレス')).toBeDisabled()
  })

  it('名前が空の場合にバリデーションエラーを表示する', async () => {
    render(<ProfileSettingsForm {...defaultProps} />)
    const nameInput = screen.getByLabelText('名前')
    await userEvent.clear(nameInput)
    fireEvent.submit(screen.getByRole('button', { name: 'プロフィールを更新' }))

    await waitFor(() => {
      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
    })
  })

  it('フォーム送信が成功した場合、成功メッセージを表示し、ページをリフレッシュする', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))
    const mockRefresh = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      refresh: mockRefresh,
    } as unknown as AppRouterInstance)
    
    render(<ProfileSettingsForm {...defaultProps} />)

    const nameInput = screen.getByLabelText('名前')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'New Name')
    
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      })
    })
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('プロフィールを更新しました')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('フォーム送信が失敗した場合、エラーメッセージを表示する', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '更新失敗' }), { status: 500 })
    )
    render(<ProfileSettingsForm {...defaultProps} />)
    
    const nameInput = screen.getByLabelText('名前')
    await userEvent.type(nameInput, ' a') // isDirtyをtrueにする
    fireEvent.submit(screen.getByRole('button', { name: 'プロフィールを更新' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('プロフィールの更新に失敗しました')
    })
  })

  it('ネットワークエラーの場合、エラーメッセージを表示する', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    render(<ProfileSettingsForm {...defaultProps} />)
    
    const nameInput = screen.getByLabelText('名前')
    await userEvent.type(nameInput, ' a')
    fireEvent.submit(screen.getByRole('button', { name: 'プロフィールを更新' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error')
    })
  })

  it('メールアドレス変更不可の説明テキストが表示される', () => {
    render(<ProfileSettingsForm {...defaultProps} />)
    expect(screen.getByText('メールアドレスは変更できません')).toBeInTheDocument()
  })
}) 