import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Book,
  MessageSquare,
  FileQuestion,
} from 'lucide-react'
import { authOptions } from '@/lib/auth/authOptions'

export const metadata: Metadata = {
  title: 'サポート | Crypto Media',
  description: 'よくある質問やお問い合わせなど、サポート情報をご案内します',
}

export default async function SupportPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const supportItems = [
    {
      title: 'よくある質問',
      description: '会員登録、決済、記事閲覧などについてのFAQ',
      icon: HelpCircle,
      href: '/media/support/faq',
    },
    {
      title: '用語集',
      description: '暗号資産・ブロックチェーンの専門用語を解説',
      icon: Book,
      href: '/media/support/glossary',
    },
    {
      title: 'お問い合わせ',
      description: 'FAQで解決しない場合はこちらから',
      icon: MessageSquare,
      href: '/contact',
    },
    {
      title: '利用ガイド',
      description: 'サービスの使い方や機能について',
      icon: FileQuestion,
      href: '/media/support/guide',
    },
  ]

  const popularTopics = [
    { title: 'ログインできない場合', href: '/media/support/faq#login' },
    { title: '有料会員の解約方法', href: '/media/support/faq#cancel' },
    { title: '支払い方法の変更', href: '/media/support/faq#payment' },
    { title: 'パスワードを忘れた場合', href: '/media/support/faq#password' },
    { title: '記事が読めない場合', href: '/media/support/faq#article' },
  ]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/media/mypage"
        className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        マイページに戻る
      </Link>

      <h1 className="mb-8 text-2xl font-bold">サポート</h1>

      {/* サポートメニュー */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">サポートメニュー</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {supportItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start">
                  <Icon className="mr-4 mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold group-hover:text-blue-600">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <ChevronRight className="ml-4 h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* よくあるトピック */}
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">よくあるトピック</h2>
        <ul className="space-y-3">
          {popularTopics.map((topic) => (
            <li key={topic.title}>
              <Link
                href={topic.href}
                className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ChevronRight className="mr-2 h-4 w-4" />
                {topic.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* お問い合わせ情報 */}
      <section className="mt-8 rounded-lg bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">お問い合わせについて</h2>
        <p className="mb-4 text-gray-600">
          FAQやガイドで解決しない場合は、お問い合わせフォームよりご連絡ください。
        </p>
        <p className="text-sm text-gray-500">
          ※ お問い合わせへの回答には数営業日いただく場合がございます。
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          お問い合わせフォームへ
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
