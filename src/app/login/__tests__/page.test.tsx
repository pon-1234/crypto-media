import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from '../page'

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockGet = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    } as ReturnType<typeof useRouter>)
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useSearchParams>)
  })

  describe('未認証状態', () => {
    beforeEach(() => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as ReturnType<typeof useSession>)
    })

    it('ログインページが正しく表示される', () => {
      mockGet.mockReturnValue(null)
      render(<LoginPage />)

      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
      expect(
        screen.getByText(
          '会員限定コンテンツへアクセスするにはログインが必要です'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Googleでログイン')).toBeInTheDocument()
    })

    it('GoogleログインボタンをクリックするとsignInが呼ばれる', async () => {
      mockGet.mockReturnValue('/media/mypage')
      render(<LoginPage />)

      const googleButton = screen.getByText('Googleでログイン')
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/media/mypage',
        })
      })
    })

    it('callbackUrlがない場合はルートにリダイレクトする', async () => {
      mockGet.mockReturnValue(null)
      render(<LoginPage />)

      const googleButton = screen.getByText('Googleでログイン')
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/',
        })
      })
    })

    it('利用規約とプライバシーポリシーへのリンクが表示される', () => {
      mockGet.mockReturnValue(null)
      render(<LoginPage />)

      const termsLink = screen.getByRole('link', { name: '利用規約' })
      const privacyLink = screen.getByRole('link', {
        name: 'プライバシーポリシー',
      })

      expect(termsLink).toHaveAttribute('href', '/terms')
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
    })

    describe('メール/パスワード認証', () => {
      it('正しい情報でログインに成功し、リダイレクトされる', async () => {
        mockGet.mockReturnValue('/dashboard')
        vi.mocked(signIn).mockResolvedValue({ ok: true, error: null } as any)

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
          target: { value: 'test@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('パスワード'), {
          target: { value: 'password123' },
        })

        const loginButton = screen.getByRole('button', { name: 'ログイン' })
        fireEvent.click(loginButton)

        await waitFor(() => {
          expect(signIn).toHaveBeenCalledWith('credentials', {
            email: 'test@example.com',
            password: 'password123',
            redirect: false,
            callbackUrl: '/dashboard',
          })
          expect(mockPush).toHaveBeenCalledWith('/dashboard')
        })
      })

      it('不正な情報でログインに失敗し、エラーメッセージが表示される', async () => {
        vi.mocked(signIn).mockResolvedValue({
          ok: false,
          error: 'CredentialsSignin',
        } as any)
        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
          target: { value: 'wrong@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('パスワード'), {
          target: { value: 'wrongpassword' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

        await waitFor(() => {
          expect(
            screen.getByText('メールアドレスまたはパスワードが正しくありません')
          ).toBeInTheDocument()
        })
      })

      it('ログイン処理中にボタンが無効化され、テキストが変更される', async () => {
        vi.mocked(signIn).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ ok: true } as any), 100))
        )
        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
          target: { value: 'test@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('パスワード'), {
          target: { value: 'password' },
        })

        const loginButton = screen.getByRole('button', { name: 'ログイン' })
        fireEvent.click(loginButton)

        expect(loginButton).toBeDisabled()
        expect(loginButton).toHaveTextContent('ログイン中...')

        await waitFor(() => {
          expect(loginButton).not.toBeDisabled()
          expect(loginButton).toHaveTextContent('ログイン')
        })
      })
    })
  })

  describe('読み込み中', () => {
    it('ローディング表示が出る', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'loading',
        update: vi.fn(),
      } as ReturnType<typeof useSession>)
      mockGet.mockReturnValue(null)

      render(<LoginPage />)

      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    })

    it('メール/パスワード認証で予期せぬエラーが発生した場合、エラーメッセージが表示される', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as ReturnType<typeof useSession>)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Network error')
      vi.mocked(signIn).mockRejectedValue(error)

      render(<LoginPage />)

      fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('パスワード'), {
        target: { value: 'password123' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

      await waitFor(() => {
        expect(screen.getByText('ログイン中にエラーが発生しました')).toBeInTheDocument()
        expect(consoleErrorSpy).toHaveBeenCalledWith('Sign in error:', error)
      })
      consoleErrorSpy.mockRestore()
    })
  })

  describe('認証済み状態', () => {
    it('callbackUrlにリダイレクトされる', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: { user: { name: 'Test User' }, expires: '2025-08-15' },
        status: 'authenticated',
        update: vi.fn(),
      } as unknown as ReturnType<typeof useSession>)
      mockGet.mockReturnValue('/media/mypage')

      render(<LoginPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/media/mypage')
      })
    })

    it('callbackUrlがない場合はルートにリダイレクトされる', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: { user: { name: 'Test User' }, expires: '2025-08-15' },
        status: 'authenticated',
        update: vi.fn(),
      } as unknown as ReturnType<typeof useSession>)
      mockGet.mockReturnValue(null)

      render(<LoginPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('signInでエラーが発生した場合、コンソールにエラーが出力される', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as ReturnType<typeof useSession>)
      mockGet.mockReturnValue(null)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const error = new Error('Sign in failed')
      vi.mocked(signIn).mockRejectedValue(error)

      render(<LoginPage />)

      const googleButton = screen.getByText('Googleでログイン')
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Sign in error:', error)
      })

      consoleErrorSpy.mockRestore()
    })

    it('メール/パスワード認証で予期せぬエラーが発生した場合、エラーメッセージが表示される', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as ReturnType<typeof useSession>)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Network error')
      vi.mocked(signIn).mockRejectedValue(error)

      render(<LoginPage />)

      fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('パスワード'), {
        target: { value: 'password123' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

      await waitFor(() => {
        expect(screen.getByText('ログイン中にエラーが発生しました')).toBeInTheDocument()
        expect(consoleErrorSpy).toHaveBeenCalledWith('Sign in error:', error)
      })
      consoleErrorSpy.mockRestore()
    })
  })
})
