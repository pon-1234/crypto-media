import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Mail, MessageCircle, Book } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ヘルプ・お問い合わせ | Crypto Media',
  description: 'よくある質問やサポートへのお問い合わせはこちらから',
}

/**
 * サポートページ
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related /media/faq - FAQページ
 * @related /media/contact - お問い合わせページ
 * @issue #38 - マイページ機能の拡張
 */
export default function SupportPage() {
  const supportItems = [
    {
      icon: Book,
      title: 'よくある質問',
      description: 'サービスに関するよくある質問をまとめています',
      href: '/media/faq',
      external: false,
    },
    {
      icon: MessageCircle,
      title: '用語集',
      description: '暗号資産・ブロックチェーンの専門用語を解説',
      href: '/media/glossary',
      external: false,
    },
    {
      icon: Mail,
      title: 'お問い合わせ',
      description: 'その他のご質問やご要望はこちらから',
      href: '/media/contact',
      external: false,
    },
  ]

  const helpTopics = [
    {
      title: '会員登録・ログインについて',
      items: [
        'パスワードを忘れた場合',
        'メールアドレスを変更したい',
        'ログインできない',
        '二段階認証の設定方法',
      ],
    },
    {
      title: '有料会員について',
      items: [
        '有料会員の特典',
        '料金プラン',
        '支払い方法の変更',
        '解約・退会について',
      ],
    },
    {
      title: '記事・コンテンツについて',
      items: [
        '記事が読めない',
        '記事の誤りを報告したい',
        '記事のリクエスト',
        'お気に入り機能の使い方',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* 戻るリンク */}
        <Link
          href="/media/mypage"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          マイページに戻る
        </Link>

        {/* ページタイトル */}
        <h1 className="mb-8 text-2xl font-bold text-gray-900">
          ヘルプ・お問い合わせ
        </h1>

        {/* サポートメニュー */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {supportItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-100">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            )
          })}
        </div>

        {/* よくあるトピック */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            よくあるトピック
          </h2>
          
          <div className="space-y-8">
            {helpTopics.map((topic) => (
              <div key={topic.title}>
                <h3 className="mb-3 font-medium text-gray-900">
                  {topic.title}
                </h3>
                <ul className="space-y-2">
                  {topic.items.map((item) => (
                    <li key={item}>
                      <Link
                        href="/media/faq"
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <span>{item}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* お問い合わせCTA */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6 text-center">
          <p className="mb-4 text-gray-700">
            お探しの情報が見つからない場合は、お気軽にお問い合わせください
          </p>
          <Link
            href="/media/contact"
            className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            <Mail className="mr-2 h-5 w-5" />
            お問い合わせフォームへ
          </Link>
        </div>
      </div>
    </div>
  )
}