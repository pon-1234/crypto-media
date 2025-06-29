import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CorporateHeader from './CorporateHeader'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

describe('CorporateHeader', () => {
  it('should render the corporate logo', () => {
    render(<CorporateHeader />)
    expect(screen.getByText('CORP')).toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    render(<CorporateHeader />)
    
    expect(screen.getByText('会社概要')).toBeInTheDocument()
    expect(screen.getByText('サービス')).toBeInTheDocument()
    expect(screen.getByText('ニュース')).toBeInTheDocument()
    expect(screen.getByText('お問い合わせ')).toBeInTheDocument()
    expect(screen.getByText('メディア')).toBeInTheDocument()
  })

  it('should have correct links for navigation items', () => {
    render(<CorporateHeader />)
    
    expect(screen.getByRole('link', { name: '会社概要' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'サービス' })).toHaveAttribute('href', '/service')
    expect(screen.getByRole('link', { name: 'ニュース' })).toHaveAttribute('href', '/news')
    expect(screen.getByRole('link', { name: 'お問い合わせ' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'メディア' })).toHaveAttribute('href', '/media')
  })

  it('should hide mobile menu by default', () => {
    render(<CorporateHeader />)
    
    const mobileNavItems = screen.queryAllByRole('link', { name: '会社概要' })
    expect(mobileNavItems).toHaveLength(1)
  })

  it('should toggle mobile menu when hamburger button is clicked', () => {
    render(<CorporateHeader />)
    
    const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
    
    fireEvent.click(menuButton)
    
    const mobileNavItems = screen.getAllByRole('link', { name: '会社概要' })
    expect(mobileNavItems).toHaveLength(2)
    
    fireEvent.click(menuButton)
    
    const updatedNavItems = screen.getAllByRole('link', { name: '会社概要' })
    expect(updatedNavItems).toHaveLength(1)
  })

})