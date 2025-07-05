/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SupportPage from '../page'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const mockedGetServerSession = vi.mocked(getServerSession)

describe('SupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('セッションがない場合、リダイレクトする', async () => {
    mockedGetServerSession.mockResolvedValue(null)
    try {
      await SupportPage()
    } catch {
      // redirectが内部でエラーをスローするためキャッチ
    }
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('ページが正しくレンダリングされる', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
      expires: '2025-01-01T00:00:00Z',
    })

    // 非同期コンポーネントを解決するためにawaitを使用
    const ResolvedComponent = await SupportPage()
    render(ResolvedComponent)

    expect(
      screen.getByRole('heading', { name: 'サポート', level: 1 })
    ).toBeInTheDocument()
  })
})
