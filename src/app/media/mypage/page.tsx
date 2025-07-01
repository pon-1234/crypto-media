import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { getUserMembership } from '@/lib/auth/membership'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  User,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronRight,
  Crown,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'マイページ | Crypto Media',
  description: 'アカウント情報と会員ステータスを確認できます',
}

/**
 * 会員マイページ
 *
 * @doc ユーザーの基本情報と会員ステータスを表示するページ
 * @related src/lib/auth/membership.ts - 会員情報取得
 * @related src/app/media/mypage/membership/page.tsx - 会員管理ページ
 * @issue #10 - 会員マイページとStripeポータルの実装
 */
export default async function MyPage() {
  // セッション情報を取得
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    // middlewareで保護されているため、ここには到達しないはず
    return null
  }

  // 会員情報を取得
  const membership = await getUserMembership()

  // 会員ステータスに応じた表示内容
  const membershipDisplay = {
    paid: {
      label: '有料会員',
      color: 'text-yellow-600 bg-yellow-50',
      icon: Crown,
      description: 'すべての有料記事をお読みいただけます',
    },
    free: {
      label: '無料会員',
      color: 'text-gray-600 bg-gray-50',
      icon: User,
      description: '無料記事のみお読みいただけます',
    },
  }

  const currentMembership = membership?.membership || 'free'
  const membershipInfo =
    membershipDisplay[currentMembership as keyof typeof membershipDisplay]

  // メニュー項目
  const menuItems = [
    {
      icon: CreditCard,
      title: '会員情報・お支払い',
      description: '会員プランの確認・変更、お支払い情報の管理',
      href: '/media/mypage/membership',
      highlight: currentMembership === 'free',
    },
    {
      icon: Settings,
      title: 'アカウント設定',
      description: 'メールアドレスやパスワードの変更',
      href: '/media/mypage/settings',
      highlight: false,
    },
    {
      icon: HelpCircle,
      title: 'ヘルプ・お問い合わせ',
      description: 'よくある質問やサポートへのお問い合わせ',
      href: '/media/mypage/support',
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ページタイトル */}
        <h1 className="mb-8 text-2xl font-bold text-gray-900">マイページ</h1>

        {/* ユーザー情報カード */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                アカウント情報
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">お名前</p>
                  <p className="font-medium text-gray-900">
                    {session.user.name || '未設定'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">メールアドレス</p>
                  <p className="font-medium text-gray-900">
                    {session.user.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">会員ステータス</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${membershipInfo.color}`}
                    >
                      <membershipInfo.icon className="h-4 w-4" />
                      {membershipInfo.label}
                    </span>
                    {membership?.membershipUpdatedAt && (
                      <span className="text-sm text-gray-500">
                        {format(
                          new Date(membership.membershipUpdatedAt),
                          'yyyy年MM月dd日',
                          { locale: ja }
                        )}
                        更新
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {membershipInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 有料会員登録CTA（無料会員の場合） */}
            {currentMembership === 'free' && (
              <Link href="/register">
                <Button className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  有料会員になる
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* メニューリスト */}
        <div className="space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                  item.highlight ? 'ring-2 ring-yellow-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-gray-100 p-3">
                      <Icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* 退会リンク */}
        <div className="mt-8 text-center">
          <Link
            href="/media/mypage/delete-account"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            退会をご希望の方はこちら
          </Link>
        </div>
      </div>
    </div>
  )
}
