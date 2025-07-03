import { vi, describe, it, expect } from 'vitest'
import { generateMetadata } from './page'

vi.mock('@/lib/corporate/generateStaticPageMetadata', () => ({
  generateStaticPageMetadata: vi.fn().mockResolvedValue({
    title: '特定商取引法に基づく表記 | 暗号資産メディア',
    description: '当サイトの特定商取引法に基づく表記です。',
  }),
}))

describe('DealingPage', () => {
  describe('generateMetadata', () => {
    it('generateStaticPageMetadataに正しいパラメータを渡す', async () => {
      const { generateStaticPageMetadata } = await import('@/lib/corporate/generateStaticPageMetadata')
      
      const metadata = await generateMetadata()

      expect(generateStaticPageMetadata).toHaveBeenCalledWith('dealing', '/dealing')
      expect(metadata).toEqual({
        title: '特定商取引法に基づく表記 | 暗号資産メディア',
        description: '当サイトの特定商取引法に基づく表記です。',
      })
    })
  })
})