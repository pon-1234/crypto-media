import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { authOptions } from '@/lib/auth/authOptions'
import { getUserMembership } from '@/lib/auth/membership'
import { DeleteAccountForm } from '@/components/account/DeleteAccountForm'

export const metadata: Metadata = {
  title: '退会手続き | Crypto Media',
  description: 'アカウントの削除と退会手続き',
}

export default async function DeleteAccountPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const membership = await getUserMembership()
  const hasPaidMembership = membership?.membership === 'paid'

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link 
        href="/media/mypage" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        マイページに戻る
      </Link>

      <h1 className="text-2xl font-bold mb-8">退会手続き</h1>

      {/* 警告メッセージ */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              退会前にご確認ください
            </h2>
            <p className="text-red-700 mb-4">
              退会処理を行うと、以下の情報がすべて削除されます：
            </p>
            <ul className="list-disc list-inside space-y-1 text-red-700 ml-4">
              <li>アカウント情報（メールアドレス、パスワードなど）</li>
              <li>お気に入り記事の履歴</li>
              <li>閲覧履歴</li>
              {hasPaidMembership && (
                <li className="font-semibold">有料会員のサブスクリプション（自動的に解約されます）</li>
              )}
            </ul>
            <p className="text-red-700 mt-4 font-semibold">
              ※ 削除されたデータは復元できません
            </p>
          </div>
        </div>
      </div>

      {/* 有料会員の場合の追加情報 */}
      {hasPaidMembership && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-yellow-900 mb-2">
            有料会員のお客様へ
          </h3>
          <p className="text-yellow-700">
            退会と同時に有料会員のサブスクリプションも解約されます。
            現在の請求期間の終了日まではサービスをご利用いただけますが、
            次回の更新は行われません。
          </p>
        </div>
      )}

      {/* 退会フォーム */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">退会理由（任意）</h2>
        <p className="text-sm text-gray-600 mb-6">
          サービス改善のため、退会理由をお聞かせください。
        </p>
        <DeleteAccountForm 
          userId={session.user.id} 
          userEmail={session.user.email || ''}
          hasPaidMembership={hasPaidMembership}
        />
      </section>

      {/* 代替案の提示 */}
      <section className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">退会の前に</h3>
        <p className="text-gray-600 mb-4">
          以下の選択肢もご検討ください：
        </p>
        <ul className="space-y-2 text-gray-600">
          {hasPaidMembership && (
            <li>
              • <Link href="/media/mypage/subscription" className="text-blue-600 hover:underline">
                有料会員の解約のみ
              </Link>を行い、無料会員として継続する
            </li>
          )}
          <li>
            • <Link href="/media/mypage/support" className="text-blue-600 hover:underline">
              サポート
            </Link>に相談する
          </li>
          <li>
            • メール配信の<Link href="/media/mypage/settings" className="text-blue-600 hover:underline">
              設定を変更
            </Link>する
          </li>
        </ul>
      </section>
    </div>
  )
}