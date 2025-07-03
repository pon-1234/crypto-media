/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from '../page'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'

// next-authのモック
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// 子コンポーネントのモック
vi.mock('@/components/account/ProfileSettingsForm', () => ({
  ProfileSettingsForm: vi.fn(() => <div data-testid="profile-form" />),
}))
vi.mock('@/components/account/PasswordChangeForm', () => ({
  PasswordChangeForm: vi.fn(() => <div data-testid="password-form" />),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('セッションが存在しない場合、何もレンダリングしない', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const { container } = render(await SettingsPage())
    expect(container.firstChild).toBeNull()
  })

  it('ユーザー情報が存在しない場合、何もレンダリングしない', async () => {
    const mockSession = { expires: '1' } as Session
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const { container } = render(await SettingsPage())
    expect(container.firstChild).toBeNull()
  })

  it('セッションが存在する場合、プロフィールとパスワードのフォームを表示する', async () => {
    const mockSession = {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: '1',
    } as Session
    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    render(await SettingsPage())

    // タイトルが表示されていることを確認
    expect(
      screen.getByRole('heading', { name: 'アカウント設定' })
    ).toBeInTheDocument()

    // プロフィール設定フォームが表示されていることを確認
    expect(screen.getByTestId('profile-form')).toBeInTheDocument()
    
    // パスワード変更フォームが表示されていることを確認
    expect(screen.getByTestId('password-form')).toBeInTheDocument()
  })
}) 