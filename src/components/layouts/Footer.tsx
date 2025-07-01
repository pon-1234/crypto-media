import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const corporateLinks = [
    { href: '/', label: 'トップ' },
    { href: '/about', label: '会社概要' },
    { href: '/service', label: 'サービス' },
    { href: '/news', label: 'ニュース' },
    { href: '/contact', label: 'お問い合わせ' },
  ]

  const mediaLinks = [
    { href: '/media', label: 'メディアトップ' },
    { href: '/media/category/news', label: 'ニュース' },
    { href: '/media/category/analysis', label: '分析' },
    { href: '/media/category/learn', label: '学習' },
    { href: '/media/category/trends', label: 'トレンド' },
  ]

  const legalLinks = [
    { href: '/terms', label: '利用規約' },
    { href: '/privacy', label: 'プライバシーポリシー' },
    { href: '/commercial', label: '特定商取引法に基づく表記' },
  ]

  return (
    <footer className="border-t bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              コーポレート
            </h3>
            <ul className="mt-4 space-y-2">
              {corporateLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              メディア
            </h3>
            <ul className="mt-4 space-y-2">
              {mediaLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              法的情報
            </h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              お問い合わせ
            </h3>
            <p className="mt-4 text-sm text-gray-600">
              ご質問やご意見がございましたら、お気軽にお問い合わせください。
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              お問い合わせフォーム
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {currentYear} 株式会社[会社名]. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
