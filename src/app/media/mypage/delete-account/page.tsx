import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { getUserMembership } from '@/lib/auth/membership'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DeleteAccountForm } from '@/components/account/DeleteAccountForm'

export const metadata: Metadata = {
  title: '退会手続き | Crypto Media',
  description: 'アカウントの削除と退会手続き',
}

/**
 * 退会手続きページ
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related DeleteAccountForm - 退会フォームコンポーネント
 * @related /api/account/delete - アカウント削除API
 * @issue #38 - マイページ機能の拡張
 */
export default async function DeleteAccountPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  const membership = await getUserMembership()
  const hasPaidMembership = membership?.membership === 'paid'

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
        <h1 className="mb-8 text-2xl font-bold text-gray-900">退会手続き</h1>

        {/* 警告メッセージ */}
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-900">
            退会前にご確認ください
          </h2>
          
          <ul className="space-y-2 text-sm text-red-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>退会するとアカウントに関連するすべてのデータが削除されます</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>削除されたデータは復元できません</span>
            </li>
            {hasPaidMembership && (
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>有料会員プランは自動的に解約されます</span>
              </li>
            )}
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>同じメールアドレスで再登録することは可能です</span>
            </li>
          </ul>
        </div>

        {/* 削除される情報 */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">
            削除される情報
          </h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-700">アカウント情報</p>
              <p>メールアドレス、パスワード、表示名などの基本情報</p>
            </div>
            
            {hasPaidMembership && (
              <div>
                <p className="font-medium text-gray-700">有料会員情報</p>
                <p>サブスクリプション、支払い履歴</p>
              </div>
            )}
            
            <div>
              <p className="font-medium text-gray-700">その他のデータ</p>
              <p>閲覧履歴、お気に入りなどの利用データ</p>
            </div>
          </div>
        </div>

        {/* 退会フォーム */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-6 font-semibold text-gray-900">
            退会手続きを進める
          </h3>
          
          <DeleteAccountForm 
            userId={session.user.id!}
            userEmail={session.user.email!}
            hasPaidMembership={hasPaidMembership}
          />
        </div>
      </div>
    </div>
  )
}