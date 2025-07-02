import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { SearchForm } from '../SearchForm'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('SearchForm', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>)
  })

  it('検索フォームが正しくレンダリングされる', () => {
    render(<SearchForm />)

    const input = screen.getByPlaceholderText('記事を検索...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'search')
  })

  it('カスタムプレースホルダーが設定できる', () => {
    render(<SearchForm placeholder="キーワードを入力..." />)

    expect(screen.getByPlaceholderText('キーワードを入力...')).toBeInTheDocument()
  })

  it('カスタムクラス名が適用される', () => {
    const { container } = render(<SearchForm className="custom-class" />)

    const form = container.querySelector('form')
    expect(form).toHaveClass('custom-class')
  })

  it('検索アイコンが表示される', () => {
    const { container } = render(<SearchForm />)

    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('h-5', 'w-5')
  })

  it('入力値が更新される', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    const input = screen.getByPlaceholderText('記事を検索...')
    await user.type(input, 'ビットコイン')

    expect(input).toHaveValue('ビットコイン')
  })

  it('検索キーワードを入力して送信すると検索結果ページに遷移する', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    const input = screen.getByPlaceholderText('記事を検索...')
    await user.type(input, 'ブロックチェーン')
    
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(mockPush).toHaveBeenCalledWith('/media/search?q=%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF%E3%83%81%E3%82%A7%E3%83%BC%E3%83%B3')
  })

  it('空白のみの検索は実行されない', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    const input = screen.getByPlaceholderText('記事を検索...')
    await user.type(input, '   ')
    
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('検索キーワードの前後の空白は除去される', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    const input = screen.getByPlaceholderText('記事を検索...')
    await user.type(input, '  イーサリアム  ')
    
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(mockPush).toHaveBeenCalledWith('/media/search?q=%E3%82%A4%E3%83%BC%E3%82%B5%E3%83%AA%E3%82%A2%E3%83%A0')
  })

  it('特殊文字が正しくエンコードされる', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    const input = screen.getByPlaceholderText('記事を検索...')
    await user.type(input, 'DeFi & NFT')
    
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(mockPush).toHaveBeenCalledWith('/media/search?q=DeFi%20%26%20NFT')
  })

  it('Enterキーで検索が実行される', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)

    const input = screen.getByPlaceholderText('記事を検索...')
    await user.type(input, 'Web3')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/media/search?q=Web3')
    })
  })
})