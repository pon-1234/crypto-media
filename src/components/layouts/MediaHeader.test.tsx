import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MediaHeader from './MediaHeader'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('MediaHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the media logo', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: null })
    
    render(<MediaHeader />)
    expect(screen.getByText('Crypto Media')).toBeInTheDocument()
  })

  it('should render all navigation items', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: null })
    
    render(<MediaHeader />)
    
    expect(screen.getByText('トップ')).toBeInTheDocument()
    expect(screen.getByText('ニュース')).toBeInTheDocument()
    expect(screen.getByText('分析')).toBeInTheDocument()
    expect(screen.getByText('学習')).toBeInTheDocument()
    expect(screen.getByText('トレンド')).toBeInTheDocument()
  })

  it('should show login and register buttons when not authenticated', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: null, status: 'unauthenticated' })
    
    render(<MediaHeader />)
    
    expect(screen.getByText('ログイン')).toBeInTheDocument()
    expect(screen.getByText('有料会員登録')).toBeInTheDocument()
  })

  it('should show user avatar when authenticated and dropdown on click', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as any).mockReturnValue({ 
      data: { 
        user: { 
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: '2024-01-01'
      },
      status: 'authenticated'
    })
    
    render(<MediaHeader />)
    
    // ユーザーアバターが表示されることを確認
    expect(screen.getByText('T')).toBeInTheDocument()
    
    // アバターをクリックしてドロップダウンを開く
    const avatarButton = screen.getByText('T').parentElement.parentElement
    fireEvent.click(avatarButton)
    
    // ドロップダウンメニューの内容を確認
    expect(screen.getByText('マイページ')).toBeInTheDocument()
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
    expect(screen.queryByText('ログイン')).not.toBeInTheDocument()
    expect(screen.queryByText('有料会員登録')).not.toBeInTheDocument()
  })

  it('should have correct links for navigation items', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: null })
    
    render(<MediaHeader />)
    
    expect(screen.getByRole('link', { name: 'トップ' })).toHaveAttribute('href', '/media')
    expect(screen.getByRole('link', { name: 'ニュース' })).toHaveAttribute('href', '/media/category/news')
    expect(screen.getByRole('link', { name: '分析' })).toHaveAttribute('href', '/media/category/analysis')
    expect(screen.getByRole('link', { name: '学習' })).toHaveAttribute('href', '/media/category/learn')
    expect(screen.getByRole('link', { name: 'トレンド' })).toHaveAttribute('href', '/media/category/trends')
  })

  it('should toggle mobile menu when hamburger button is clicked', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: null })
    
    render(<MediaHeader />)
    
    const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
    
    fireEvent.click(menuButton)
    
    const mobileNavItems = screen.getAllByRole('link', { name: 'トップ' })
    expect(mobileNavItems).toHaveLength(2)
    
    fireEvent.click(menuButton)
    
    const updatedNavItems = screen.getAllByRole('link', { name: 'トップ' })
    expect(updatedNavItems).toHaveLength(1)
  })

})