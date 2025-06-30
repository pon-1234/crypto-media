import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import CorporateHeader from './CorporateHeader'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

describe('CorporateHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('should render the corporate logo', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)
    
    render(<CorporateHeader />)
    expect(screen.getByText('CORP')).toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)
    
    render(<CorporateHeader />)
    
    expect(screen.getByText('会社概要')).toBeInTheDocument()
    expect(screen.getByText('サービス')).toBeInTheDocument()
    expect(screen.getByText('ニュース')).toBeInTheDocument()
    expect(screen.getByText('お問い合わせ')).toBeInTheDocument()
    expect(screen.getByText('メディア')).toBeInTheDocument()
  })

  it('should have correct links for navigation items', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)
    
    render(<CorporateHeader />)
    
    expect(screen.getByRole('link', { name: '会社概要' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'サービス' })).toHaveAttribute('href', '/service')
    expect(screen.getByRole('link', { name: 'ニュース' })).toHaveAttribute('href', '/news')
    expect(screen.getByRole('link', { name: 'お問い合わせ' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'メディア' })).toHaveAttribute('href', '/media')
  })

  it('should hide mobile menu by default', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)
    
    render(<CorporateHeader />)
    
    const mobileNavItems = screen.queryAllByRole('link', { name: '会社概要' })
    expect(mobileNavItems).toHaveLength(1)
  })

  it('should toggle mobile menu when hamburger button is clicked', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any)
    
    render(<CorporateHeader />)
    
    const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
    
    fireEvent.click(menuButton)
    
    const mobileNavItems = screen.getAllByRole('link', { name: '会社概要' })
    expect(mobileNavItems).toHaveLength(2)
    
    fireEvent.click(menuButton)
    
    const updatedNavItems = screen.getAllByRole('link', { name: '会社概要' })
    expect(updatedNavItems).toHaveLength(1)
  })

  describe('認証状態による表示', () => {
    it('未認証時はログインボタンが表示される', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any)

      render(<CorporateHeader />)
      
      expect(screen.getByText('ログイン')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'ログイン' })).toHaveAttribute('href', '/login')
    })

    it('読み込み中はローディング表示が出る', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'loading',
      } as any)

      render(<CorporateHeader />)
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })

    it('認証済みの場合はユーザーアバターが表示される', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/avatar.jpg',
          },
        },
        status: 'authenticated',
      } as any)

      render(<CorporateHeader />)
      
      const avatar = screen.getByAltText('Test User')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('画像がない場合はイニシャルが表示される', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        status: 'authenticated',
      } as any)

      render(<CorporateHeader />)
      
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('ユーザーメニューの開閉ができる', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        status: 'authenticated',
      } as any)

      render(<CorporateHeader />)
      
      // メニューは最初は閉じている
      expect(screen.queryByText('マイページ')).not.toBeInTheDocument()
      
      // アバターをクリックしてメニューを開く
      const avatarButton = screen.getByText('T').parentElement.parentElement
      fireEvent.click(avatarButton)
      
      await waitFor(() => {
        expect(screen.getByText('マイページ')).toBeInTheDocument()
        expect(screen.getByText('ログアウト')).toBeInTheDocument()
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
      
      // もう一度クリックして閉じる
      fireEvent.click(avatarButton)
      
      await waitFor(() => {
        expect(screen.queryByText('マイページ')).not.toBeInTheDocument()
      })
    })

    it('ログアウトボタンをクリックするとsignOutが呼ばれる', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        status: 'authenticated',
      } as any)

      render(<CorporateHeader />)
      
      // メニューを開く
      const avatarButton = screen.getByText('T').parentElement.parentElement
      fireEvent.click(avatarButton)
      
      // ログアウトボタンをクリック
      const logoutButton = await screen.findByText('ログアウト')
      fireEvent.click(logoutButton)
      
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })
  })

})