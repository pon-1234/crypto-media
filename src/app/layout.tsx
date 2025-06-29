import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import '../styles/globals.css'
import AuthProvider from '@/components/providers/AuthProvider'
import CorporateHeader from '@/components/layouts/CorporateHeader'
import MediaHeader from '@/components/layouts/MediaHeader'
import Footer from '@/components/layouts/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Crypto Media & Corporate Site',
  description: 'SEOメディアとコーポレートサイトを統合したプラットフォーム',
}

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
          <div className="min-h-screen flex flex-col">
            {layoutType === 'media' ? <MediaHeader /> : <CorporateHeader />}
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}