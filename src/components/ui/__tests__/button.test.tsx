import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

/**
 * Buttonコンポーネントのテスト
 * @doc レスポンシブデザインとアクセシビリティのテスト
 * @issue #14 - レスポンシブデザインの最終調整
 */
describe('Button', () => {
  describe('基本的な動作', () => {
    it('ボタンが正しくレンダリングされる', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
    })

    it('クリックイベントが正しく動作する', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      
      await user.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('disabled状態で操作できない', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick} disabled>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      
      expect(button).toBeDisabled()
      await user.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('バリアント', () => {
    it('defaultバリアントが適用される', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button', { name: 'Default' })
      expect(button).toHaveClass('bg-indigo-600', 'text-white')
    })

    it('outlineバリアントが適用される', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button', { name: 'Outline' })
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-white')
    })

    it('ghostバリアントが適用される', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button', { name: 'Ghost' })
      expect(button).toHaveClass('text-gray-700')
    })

    it('destructiveバリアントが適用される', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button', { name: 'Delete' })
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })
  })

  describe('サイズ', () => {
    it('defaultサイズが適用される', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button', { name: 'Default Size' })
      expect(button).toHaveClass('min-h-[44px]', 'px-4', 'py-2')
    })

    it('smサイズが適用される', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button', { name: 'Small' })
      expect(button).toHaveClass('min-h-[36px]', 'px-3', 'py-1.5')
    })

    it('lgサイズが適用される', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button', { name: 'Large' })
      expect(button).toHaveClass('min-h-[48px]', 'px-6', 'py-3')
    })
  })

  describe('レスポンシブデザイン', () => {
    it('fullWidthプロパティで全幅になる', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button', { name: 'Full Width' })
      expect(button).toHaveClass('w-full')
    })

    it('touch-manipulationクラスが適用される', () => {
      render(<Button>Touch Friendly</Button>)
      const button = screen.getByRole('button', { name: 'Touch Friendly' })
      expect(button).toHaveClass('touch-manipulation')
    })

    it('モバイルでの最小高さが確保される', () => {
      render(<Button>Mobile Button</Button>)
      const button = screen.getByRole('button', { name: 'Mobile Button' })
      // モバイルでの最小高さ44pxが設定されている
      expect(button).toHaveClass('min-h-[44px]')
    })

    it('アクティブ状態のスタイルが適用される', () => {
      render(<Button>Active State</Button>)
      const button = screen.getByRole('button', { name: 'Active State' })
      expect(button).toHaveClass('active:bg-indigo-800')
    })
  })

  describe('アクセシビリティ', () => {
    it('フォーカスリングが表示される', () => {
      render(<Button>Accessible</Button>)
      const button = screen.getByRole('button', { name: 'Accessible' })
      expect(button).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-offset-2'
      )
    })

    it('カスタムクラスが追加できる', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button', { name: 'Custom' })
      expect(button).toHaveClass('custom-class')
    })

    it('ref転送が正しく動作する', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Ref Button</Button>)
      expect(ref).toHaveBeenCalled()
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement)
    })
  })
})