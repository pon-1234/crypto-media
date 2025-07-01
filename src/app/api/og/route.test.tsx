import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

// @vercel/ogのImageResponseをモック
vi.mock('@vercel/og', () => ({
  ImageResponse: vi.fn().mockImplementation(() => {
    return new Response('mocked-image-response', {
      headers: {
        'content-type': 'image/png',
      },
    })
  }),
}))

describe('OG Image API Route', () => {
  const createRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/og')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    return new NextRequest(url)
  }

  it('should generate OG image with default parameters', async () => {
    const request = createRequest()
    const response = await GET(request)

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('should generate OG image with custom title', async () => {
    const request = createRequest({
      title: 'ビットコインの価格予測 2025年版',
    })
    const response = await GET(request)

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('should generate OG image for article type', async () => {
    const request = createRequest({
      title: '仮想通貨の税金対策完全ガイド',
      description: '仮想通貨投資における税金の基礎知識から節税対策まで',
      type: 'article',
      category: '税金・法律',
    })
    const response = await GET(request)

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('should generate OG image for corporate type', async () => {
    const request = createRequest({
      title: '会社概要',
      description: '私たちについて',
      type: 'corporate',
    })
    const response = await GET(request)

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('should generate OG image for media type', async () => {
    const request = createRequest({
      title: 'Crypto Media - 仮想通貨メディア',
      description: '最新の仮想通貨ニュースと投資情報',
      type: 'media',
    })
    const response = await GET(request)

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('should handle long titles gracefully', async () => {
    const request = createRequest({
      title:
        'これは非常に長いタイトルです。50文字を超える場合はフォントサイズが調整されることを確認するためのテストケースです。',
    })
    const response = await GET(request)

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('should handle empty parameters', async () => {
    const request = createRequest({
      title: '',
      description: '',
      category: '',
    })
    const response = await GET(request)

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toBe('image/png')
  })

  it('should handle error gracefully', async () => {
    // ImageResponseをエラーを投げるようにモック
    const { ImageResponse } = await import('@vercel/og')
    ;(
      ImageResponse as unknown as ReturnType<typeof vi.fn>
    ).mockImplementationOnce(() => {
      throw new Error('Image generation failed')
    })

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(500)
    const text = await response.text()
    expect(text).toBe('Failed to generate the image')
  })
})
