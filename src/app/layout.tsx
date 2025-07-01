import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import '../styles/globals.css'
import AuthProvider from '@/components/providers/AuthProvider'
import CorporateHeader from '@/components/layouts/CorporateHeader'
import MediaHeader from '@/components/layouts/MediaHeader'
import Footer from '@/components/layouts/Footer'
import { OrganizationSchema, WebSiteSchema } from '@/components/seo'
import { generatePageMetadata } from '@/lib/metadata/generateMetadata'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generatePageMetadata({
  title: 'Crypto Media - 仮想通貨・ブロックチェーンの最新情報メディア',
  description:
    '仮想通貨・ブロックチェーンの最新ニュース、投資戦略、税金対策などを網羅的に提供する日本最大級のメディアプラットフォーム',
  keywords: [
    '仮想通貨',
    'ブロックチェーン',
    'ビットコイン',
    'イーサリアム',
    '投資',
    '税金対策',
    'DeFi',
    'NFT',
  ],
  ogImageParams: {
    title: 'Crypto Media',
    description: '仮想通貨投資を、もっと身近に。',
    type: 'default',
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const layoutType = headersList.get('x-layout-type')

  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            {layoutType === 'media' ? <MediaHeader /> : <CorporateHeader />}
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        <OrganizationSchema />
        <WebSiteSchema />
      </body>
    </html>
  )
}
