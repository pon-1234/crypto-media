import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-indigo-600', 'text-white', 'px-4', 'py-2', 'text-sm')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button', { name: 'Outline Button' })
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white', 'text-gray-700')
  })

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    const button = screen.getByRole('button', { name: 'Ghost Button' })
    expect(button).toHaveClass('text-gray-700')
    expect(button).not.toHaveClass('bg-white')
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass('bg-red-600', 'text-white')
  })

  it('renders with small size', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button', { name: 'Small Button' })
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs')
  })

  it('renders with large size', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button', { name: 'Large Button' })
    expect(button).toHaveClass('px-6', 'py-3', 'text-base')
  })

  it('renders with fullWidth prop', () => {
    render(<Button fullWidth>Full Width Button</Button>)
    const button = screen.getByRole('button', { name: 'Full Width Button' })
    expect(button).toHaveClass('w-full')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button', { name: 'Custom Button' })
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Button ref={ref}>Ref Button</Button>)
    expect(ref).toHaveBeenCalled()
  })

  it('handles onClick event', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    const button = screen.getByRole('button', { name: 'Clickable Button' })
    
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('respects disabled state', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>)
    const button = screen.getByRole('button', { name: 'Disabled Button' })
    
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    
    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('passes through other HTML button attributes', () => {
    render(
      <Button type="submit" aria-label="Submit form" data-testid="submit-btn">
        Submit
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Submit form' })
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('aria-label', 'Submit form')
    expect(button).toHaveAttribute('data-testid', 'submit-btn')
  })

  it('combines multiple props correctly', () => {
    render(
      <Button 
        variant="outline" 
        size="lg" 
        fullWidth 
        className="custom-class"
      >
        Combined Props
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Combined Props' })
    expect(button).toHaveClass(
      'border',
      'border-gray-300',
      'bg-white',
      'text-gray-700',
      'px-6',
      'py-3',
      'text-base',
      'w-full',
      'custom-class'
    )
  })
})