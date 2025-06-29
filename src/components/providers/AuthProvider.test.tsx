import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AuthProvider from './AuthProvider'

// SessionProviderをモック
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}))

describe('AuthProvider', () => {
  it('子要素をSessionProviderでラップする', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Test Child</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('複数の子要素を正しくレンダリングする', () => {
    render(
      <AuthProvider>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('child1')).toBeInTheDocument()
    expect(screen.getByTestId('child2')).toBeInTheDocument()
  })
})