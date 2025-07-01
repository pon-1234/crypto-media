import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { WebSiteSchema } from './WebSiteSchema'

describe('WebSiteSchema', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://crypto-media.jp'
  })

  it('should render WebSite structured data', () => {
    const { container } = render(<WebSiteSchema />)

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()

    const data = JSON.parse(script?.innerHTML || '{}')
    expect(data['@type']).toBe('WebSite')
    expect(data.name).toBe('Crypto Media')
    expect(data.url).toBe('https://crypto-media.jp')
  })

  it('should include search action', () => {
    const { container } = render(<WebSiteSchema />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script?.innerHTML || '{}')

    expect(data.potentialAction).toEqual({
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://crypto-media.jp/media/articles?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    })
  })

  it('should include publisher information', () => {
    const { container } = render(<WebSiteSchema />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script?.innerHTML || '{}')

    expect(data.publisher).toEqual({
      '@type': 'Organization',
      name: 'Crypto Media',
      url: 'https://crypto-media.jp',
      logo: {
        '@type': 'ImageObject',
        url: 'https://crypto-media.jp/logo.png',
        width: 600,
        height: 60,
      },
    })
  })

  it('should include language and copyright information', () => {
    const currentYear = new Date().getFullYear()
    const { container } = render(<WebSiteSchema />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script?.innerHTML || '{}')

    expect(data.inLanguage).toBe('ja-JP')
    expect(data.copyrightYear).toBe(currentYear)
    expect(data.copyrightHolder).toEqual({
      '@type': 'Organization',
      name: 'Crypto Media',
    })
  })

  it('should include complete description', () => {
    const { container } = render(<WebSiteSchema />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script?.innerHTML || '{}')

    expect(data.description).toContain('仮想通貨・ブロックチェーン')
    expect(data.description).toContain('投資戦略')
    expect(data.description).toContain('税金対策')
  })

  it('should use default URL when environment variable is not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL

    const { container } = render(<WebSiteSchema />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script?.innerHTML || '{}')

    expect(data.url).toBe('https://crypto-media.jp')
    expect(data.potentialAction.target.urlTemplate).toContain(
      'https://crypto-media.jp'
    )
  })
})
