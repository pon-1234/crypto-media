import { vi, describe, it, expect } from 'vitest'
import { generateMetadata } from './page'

vi.mock('@/lib/corporate/generateStaticPageMetadata', () => ({
  generateStaticPageMetadata: vi.fn().mockResolvedValue({
    title: 'プライバシーポリシー | 暗号資産メディア',
    description: '当サイトのプライバシーポリシーです。',
  }),
}))

describe('PrivacyPolicyPage', () => {
  describe('generateMetadata', () => {
    it('generateStaticPageMetadataに正しいパラメータを渡す', async () => {
      const { generateStaticPageMetadata } = await import('@/lib/corporate/generateStaticPageMetadata')
      
      const metadata = await generateMetadata()

      expect(generateStaticPageMetadata).toHaveBeenCalledWith('privacy-policy', '/privacy-policy')
      expect(metadata).toEqual({
        title: 'プライバシーポリシー | 暗号資産メディア',
        description: '当サイトのプライバシーポリシーです。',
      })
    })
  })
})