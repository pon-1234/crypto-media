/**
 * Next.js関連のモック設定
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { vi } from 'vitest'
import React from 'react'

// next/link のモック
vi.mock('next/link', () => ({
  default: React.forwardRef<HTMLAnchorElement, any>(({ children, href, ...props }, ref) =>
    React.createElement('a', { href, ref, ...props }, children)
  ),
}))

// next/image のモック
vi.mock('next/image', () => ({
  default: React.forwardRef<HTMLImageElement, any>(({ src, alt, ...props }, ref) =>
    React.createElement('img', { src, alt, ref, ...props })
  ),
}))

// next/navigation のモック
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockRefresh = vi.fn()
const mockPrefetch = vi.fn()
const mockBack = vi.fn()
const mockForward = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// next/headers のモック
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}))

export { mockPush, mockReplace, mockRefresh, mockPrefetch, mockBack, mockForward }