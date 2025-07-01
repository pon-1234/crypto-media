/**
 * Next.js ミドルウェアのテスト
 * @doc DEVELOPMENT_GUIDE.md#認証フロー
 * @related src/middleware.ts - テスト対象のミドルウェア
 * @issue #7 - NextAuth.js + Firebase認証の実装
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { middleware } from './middleware'

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

vi.mock('next/server', () => {
  const mockHeaders = {
    set: vi.fn(),
  }

  const mockRedirect = vi.fn(() => ({
    headers: mockHeaders,
  }))

  return {
    NextResponse: {
      next: vi.fn(() => ({
        headers: mockHeaders,
      })),
      redirect: mockRedirect,
    },
    NextRequest: vi.fn(),
  }
})

// Import mocked modules to access the mocks
const { NextResponse: MockedNextResponse } = vi.mocked(
  await import('next/server')
)

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set x-layout-type header to "media" for /media paths', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/media/articles/test',
      },
      url: 'http://localhost:3000/media/articles/test',
    } as unknown as NextRequest

    const response = await middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith('x-layout-type', 'media')
  })

  it('should set x-layout-type header to "media" for exact /media/ path', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/media/',
      },
      url: 'http://localhost:3000/media/',
    } as unknown as NextRequest

    const response = await middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith('x-layout-type', 'media')
  })

  it('should set x-layout-type header to "corporate" for non-media paths', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/about',
      },
      url: 'http://localhost:3000/about',
    } as unknown as NextRequest

    const response = await middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith(
      'x-layout-type',
      'corporate'
    )
  })

  it('should set x-layout-type header to "corporate" for root path', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/',
      },
      url: 'http://localhost:3000/',
    } as unknown as NextRequest

    const response = await middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith(
      'x-layout-type',
      'corporate'
    )
  })

  it('should set x-layout-type header to "corporate" for paths containing media but not starting with /media/', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/about/media-kit',
      },
      url: 'http://localhost:3000/about/media-kit',
    } as unknown as NextRequest

    const response = await middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith(
      'x-layout-type',
      'corporate'
    )
  })

  describe('認証が必要なパスの保護', () => {
    it('未認証の場合、保護されたパスへのアクセスはログインページにリダイレクトされる', async () => {
      vi.mocked(getToken).mockResolvedValue(null)

      const mockRequest = {
        nextUrl: {
          pathname: '/media/mypage',
        },
        url: 'http://localhost:3000/media/mypage',
      } as unknown as NextRequest

      await middleware(mockRequest)

      expect(getToken).toHaveBeenCalledWith({
        req: mockRequest,
        secret: process.env.NEXTAUTH_SECRET,
      })

      expect(MockedNextResponse.redirect).toHaveBeenCalled()
      const redirectCall = vi.mocked(MockedNextResponse.redirect).mock
        .calls[0][0]
      expect(redirectCall.toString()).toContain('/login')
      expect(redirectCall.toString()).toContain('callbackUrl=%2Fmedia%2Fmypage')
    })

    it('認証済みの場合、保護されたパスへアクセスできる', async () => {
      vi.mocked(getToken).mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      })

      const mockRequest = {
        nextUrl: {
          pathname: '/media/mypage/settings',
        },
        url: 'http://localhost:3000/media/mypage/settings',
      } as unknown as NextRequest

      const response = await middleware(mockRequest)

      expect(MockedNextResponse.redirect).not.toHaveBeenCalled()
      expect(response.headers.set).toHaveBeenCalledWith(
        'x-layout-type',
        'media'
      )
    })

    it('保護されていないパスは認証チェックをスキップする', async () => {
      const mockRequest = {
        nextUrl: {
          pathname: '/media/articles/test',
        },
        url: 'http://localhost:3000/media/articles/test',
      } as unknown as NextRequest

      await middleware(mockRequest)

      expect(getToken).not.toHaveBeenCalled()
    })

    it('複数の保護されたパスが正しく認識される', async () => {
      vi.mocked(getToken).mockResolvedValue(null)

      const protectedPaths = [
        '/media/mypage',
        '/media/mypage/membership',
        '/media/mypage/settings',
        '/media/mypage/support',
      ]

      for (const path of protectedPaths) {
        vi.clearAllMocks()

        const mockRequest = {
          nextUrl: {
            pathname: path,
          },
          url: `http://localhost:3000${path}`,
        } as unknown as NextRequest

        await middleware(mockRequest)

        expect(MockedNextResponse.redirect).toHaveBeenCalled()
      }
    })
  })
})
