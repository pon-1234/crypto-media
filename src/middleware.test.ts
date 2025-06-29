import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({
      headers: {
        set: vi.fn(),
      },
    })),
  },
  NextRequest: vi.fn(),
}))

describe('middleware', () => {
  it('should set x-layout-type header to "media" for /media paths', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/media/articles/test',
      },
    } as NextRequest

    const response = middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith('x-layout-type', 'media')
  })

  it('should set x-layout-type header to "media" for exact /media/ path', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/media/',
      },
    } as NextRequest

    const response = middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith('x-layout-type', 'media')
  })

  it('should set x-layout-type header to "corporate" for non-media paths', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/about',
      },
    } as NextRequest

    const response = middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith('x-layout-type', 'corporate')
  })

  it('should set x-layout-type header to "corporate" for root path', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/',
      },
    } as NextRequest

    const response = middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith('x-layout-type', 'corporate')
  })

  it('should set x-layout-type header to "corporate" for paths containing media but not starting with /media/', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/about/media-kit',
      },
    } as NextRequest

    const response = middleware(mockRequest)

    expect(response.headers.set).toHaveBeenCalledWith('x-layout-type', 'corporate')
  })
})