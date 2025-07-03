/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeleteAccountPage from '../page'
import { getServerSession } from 'next-auth'
import { getUserMembership } from '@/lib/auth/membership'
import type { Session } from 'next-auth'

// モックの設定
vi.mock('next-auth')
vi.mock('@/lib/auth/membership')
vi.mock('@/components/account/DeleteAccountForm', () => ({
  DeleteAccountForm: vi.fn(() => <div data-testid="delete-form" />),
}))
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <div />,
}))

describe('DeleteAccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession: Session = {
    user: { id: 'test-user', email: 'test@example.com' },
    expires: '1',
  }

  it('セッションがない場合、何もレンダリングしない', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const { container } = render(await DeleteAccountPage())
    expect(container.firstChild).toBeNull()
  })

  it('無料会員の場合、適切な警告メッセージを表示する', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(getUserMembership).mockResolvedValue({
      userId: 'test-user',
      email: 'test@example.com',
      membership: 'free',
    })
    render(await DeleteAccountPage())

    expect(screen.getByText('退会前にご確認ください')).toBeInTheDocument()
    expect(
      screen.queryByText('有料会員プランは自動的に解約されます')
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('delete-form')).toBeInTheDocument()
  })

  it('有料会員の場合、有料会員向けの警告メッセージを表示する', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(getUserMembership).mockResolvedValue({
      userId: 'test-user',
      email: 'test@example.com',
      membership: 'paid',
    })
    render(await DeleteAccountPage())

    expect(screen.getByText('退会前にご確認ください')).toBeInTheDocument()
    expect(
      screen.getByText('有料会員プランは自動的に解約されます')
    ).toBeInTheDocument()
    expect(
      screen.getByText('サブスクリプション、支払い履歴')
    ).toBeInTheDocument()
    expect(screen.getByTestId('delete-form')).toBeInTheDocument()
  })
}) 