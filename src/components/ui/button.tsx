import * as React from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * ボタンのバリアント
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  /**
   * ボタンのサイズ
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg'
  /**
   * ボタンを全幅にするかどうか
   * @default false
   */
  fullWidth?: boolean
}

/**
 * 再利用可能なボタンコンポーネント
 * 
 * @doc プロジェクト全体で一貫したボタンスタイルを提供
 * @related src/components/media/Paywall.tsx - ペイウォールでの使用例
 * @related src/app/login/page.tsx - ログインページでの使用例
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', fullWidth = false, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-indigo-500',
      ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
    }
    
    const sizes = {
      default: 'px-4 py-2 text-sm',
      sm: 'px-3 py-1.5 text-xs',
      lg: 'px-6 py-3 text-base'
    }
    
    return (
      <button
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'