/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from '../page'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/membership'

// next-authのモック
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth/membership', () => ({
  getUser: vi.fn(),
}))

// 子コンポーネントのモック
vi.mock('@/components/account/ProfileSettingsForm', () => ({
  ProfileSettingsForm: vi.fn(() => <div data-testid="profile-form" />),
}))
vi.mock('@/components/account/PasswordChangeForm', () => ({
  PasswordChangeForm: vi.fn(() => <div data-testid="password-form" />),
}))

const mockedGetServerSession = vi.mocked(getServerSession)
const mockedGetUser = vi.mocked(getUser)

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('セッションが存在しない場合、リダイレクトする', async () => {
    mockedGetServerSession.mockResolvedValue(null)
    // redirectが呼ばれることを期待するため、renderはtry-catchで囲む
    try {
      await SettingsPage()
    } catch {
      // redirect()は内部でエラーをスローするため、それをキャッチする
    }
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('ユーザー情報が存在しない場合、リダイレクトする', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'credentials',
      },
      expires: '2025-01-01T00:00:00Z',
    })
    // getUserがnullを返すようにモック
    mockedGetUser.mockResolvedValue(null)
    try {
      await SettingsPage()
    } catch {
      // redirect()は内部でエラーをスローするため、それをキャッチする
    }
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('セッションが存在する場合、プロフィールとパスワードのフォームを表示する', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'credentials',
      },
      expires: '2025-01-01T00:00:00Z',
    })
    mockedGetUser.mockResolvedValue({
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      membership: 'free',
    })

    const { container } = render(await SettingsPage())

    // タイトルが表示されていることを確認
    expect(
      screen.getByRole('heading', { name: 'プロフィール設定' })
    ).toBeInTheDocument()

    // フォームが表示されていることを確認
    expect(container.querySelector('form')).toBeInTheDocument()
    expect(screen.getByText('表示名の変更')).toBeInTheDocument()
    expect(screen.getByText('パスワードの変更')).toBeInTheDocument()
  })

  it('Googleログインの場合、パスワード変更フォームを表示しない', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        id: 'test-user-google',
        email: 'google@example.com',
        name: 'Google User',
        provider: 'google', // プロバイダーがgoogle
      },
      expires: '2025-01-01T00:00:00Z',
    })
    mockedGetUser.mockResolvedValue({
      id: 'test-user-google',
      email: 'google@example.com',
      name: 'Google User',
      membership: 'paid',
    })

    render(await SettingsPage())

    expect(screen.getByText('表示名の変更')).toBeInTheDocument()
    // パスワードの変更フォームは表示されない
    expect(screen.queryByText('パスワードの変更')).not.toBeInTheDocument()
  })
})
