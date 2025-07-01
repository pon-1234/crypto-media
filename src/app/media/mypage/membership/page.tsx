import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { getUserMembership } from '@/lib/auth/membership'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Crown,
  ArrowLeft,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '会員情報・お支払い | Crypto Media',
  description: '会員プランの確認・変更、お支払い情報の管理',
}

/**
 * 会員管理ページ
 *
 * @doc 会員プランの確認・変更、Stripeカスタマーポータルへのアクセスを提供
 * @related src/app/api/stripe/portal/route.ts - Stripeポータルへのリダイレクト
 * @related src/lib/auth/membership.ts - 会員情報取得
 * @issue #10 - 会員マイページとStripeポータルの実装
 */
export default async function MembershipPage() {
  // セッション情報を取得
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    // middlewareで保護されているため、ここには到達しないはず
    return null
  }

  // 会員情報を取得
  const membership = await getUserMembership()
  const isPaidMember = membership?.membership === 'paid'

  // 支払いステータスの表示
  const paymentStatusDisplay = {
    active: {
      label: '正常',
      color: 'text-green-600 bg-green-50',
      icon: CheckCircle,
      description: 'お支払いは正常に処理されています',
    },
    past_due: {
      label: '支払い遅延',
      color: 'text-yellow-600 bg-yellow-50',
      icon: AlertCircle,
      description: 'お支払いの確認が必要です',
    },
    canceled: {
      label: 'キャンセル済み',
      color: 'text-gray-600 bg-gray-50',
      icon: XCircle,
      description: 'サブスクリプションはキャンセルされました',
    },
    unpaid: {
      label: '未払い',
      color: 'text-red-600 bg-red-50',
      icon: AlertCircle,
      description: 'お支払いが確認できません',
    },
  }

  const currentPaymentStatus = membership?.paymentStatus || 'active'
  const paymentInfo =
    paymentStatusDisplay[
      currentPaymentStatus as keyof typeof paymentStatusDisplay
    ] || paymentStatusDisplay.active

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* 戻るリンク */}
        <Link
          href="/media/mypage"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          マイページに戻る
        </Link>

        {/* ページタイトル */}
        <h1 className="mb-8 text-2xl font-bold text-gray-900">
          会員情報・お支払い
        </h1>

        {/* 現在のプラン */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            現在のプラン
          </h2>

          {isPaidMember ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      有料会員プラン
                    </p>
                    <p className="text-gray-600">月額 1,980円（税込）</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${paymentInfo.color}`}
                >
                  <paymentInfo.icon className="h-4 w-4" />
                  {paymentInfo.label}
                </span>
              </div>

              <p className="text-sm text-gray-600">{paymentInfo.description}</p>

              {membership.membershipUpdatedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(
                      new Date(membership.membershipUpdatedAt),
                      'yyyy年MM月dd日',
                      { locale: ja }
                    )}
                    に更新
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <Crown className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">無料会員</p>
                  <p className="text-gray-600">無料記事のみ閲覧可能</p>
                </div>
              </div>

              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="mb-3 text-sm font-medium text-yellow-900">
                  有料会員になると以下の特典があります：
                </p>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>• すべての有料記事が読み放題</li>
                  <li>• 専門家による深い分析・調査レポート</li>
                  <li>• 最新の暗号資産・ブロックチェーン情報</li>
                </ul>
                <Link href="/register" className="mt-4 block">
                  <Button className="w-full">
                    <Crown className="mr-2 h-4 w-4" />
                    有料会員になる（月額1,980円）
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 契約情報管理（有料会員のみ） */}
        {isPaidMember && membership.stripeCustomerId && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              契約情報管理
            </h2>

            <p className="mb-4 text-gray-600">
              お支払い方法の変更、請求書の確認、サブスクリプションのキャンセルなどは、
              Stripeカスタマーポータルから行えます。
            </p>

            <form action="/api/stripe/portal" method="POST">
              <Button
                type="submit"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                契約情報を管理する
              </Button>
            </form>

            <p className="mt-4 text-sm text-gray-500">
              ※ Stripeの安全なポータルページに移動します
            </p>
          </div>
        )}

        {/* 注意事項 */}
        <div className="rounded-lg bg-gray-100 p-6">
          <h3 className="mb-3 font-semibold text-gray-900">ご注意事項</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              •
              サブスクリプションは自動更新されます。キャンセルはいつでも可能です。
            </li>
            <li>
              •
              キャンセル後も、現在の請求期間の終了日まで有料会員の特典をご利用いただけます。
            </li>
            <li>
              • お支払い情報の変更後、反映までに数分かかる場合があります。
            </li>
            <li>
              • ご不明な点がございましたら、
              <Link
                href="/media/mypage/support"
                className="text-blue-600 hover:text-blue-800"
              >
                サポート
              </Link>
              までお問い合わせください。
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
