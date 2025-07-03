import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { ChevronLeft, ChevronRight, HelpCircle, Book, MessageSquare, FileQuestion } from 'lucide-react'
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link 
        href="/media/mypage" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        マイページに戻る
      </Link>

      <h1 className="text-2xl font-bold mb-8">サポート</h1>

      {/* サポートメニュー */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">サポートメニュー</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {supportItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                href={item.href}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start">
                  <Icon className="w-6 h-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 group-hover:text-blue-600">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 ml-4" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* よくあるトピック */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">よくあるトピック</h2>
        <ul className="space-y-3">
          {popularTopics.map((topic) => (
            <li key={topic.title}>
              <Link
                href={topic.href}
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                {topic.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* お問い合わせ情報 */}
      <section className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">お問い合わせについて</h2>
        <p className="text-gray-600 mb-4">
          FAQやガイドで解決しない場合は、お問い合わせフォームよりご連絡ください。
        </p>
        <p className="text-sm text-gray-500">
          ※ お問い合わせへの回答には数営業日いただく場合がございます。
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800"
        >
          お問い合わせフォームへ
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </section>
    </div>
  )
}