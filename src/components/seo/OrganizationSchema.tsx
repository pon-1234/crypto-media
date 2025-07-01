import { StructuredData } from './StructuredData'

/**
 * Organization構造化データを生成するコンポーネント
 * @doc https://schema.org/Organization
 * @related src/app/layout.tsx
 */
export function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crypto-media.jp'

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Crypto Media',
    alternateName: 'クリプトメディア',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 600,
      height: 60,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+81-3-1234-5678',
      contactType: 'customer service',
      areaServed: 'JP',
      availableLanguage: ['Japanese', 'English'],
    },
    sameAs: [
      'https://twitter.com/cryptomedia_jp',
      'https://www.facebook.com/cryptomedia.jp',
      'https://www.linkedin.com/company/crypto-media-jp',
      'https://www.youtube.com/@cryptomedia_jp',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '東京都渋谷区',
      addressLocality: '渋谷区',
      addressRegion: '東京都',
      postalCode: '150-0001',
      addressCountry: 'JP',
    },
    foundingDate: '2024-01-01',
    founders: [
      {
        '@type': 'Person',
        name: 'Crypto Media Founder',
      },
    ],
    description:
      '仮想通貨・ブロックチェーンの最新情報を提供する日本最大級のメディアプラットフォーム',
    slogan: '仮想通貨投資を、もっと身近に。',
  }

  return <StructuredData data={organizationData} />
}
