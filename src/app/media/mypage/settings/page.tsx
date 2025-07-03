import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProfileSettingsForm } from '@/components/account/ProfileSettingsForm'
import { PasswordChangeForm } from '@/components/account/PasswordChangeForm'

export const metadata: Metadata = {
  title: 'アカウント設定 | Crypto Media',
  description: 'プロフィールの編集とパスワードの変更ができます',
}

/**
 * アカウント設定ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related ProfileSettingsForm - プロフィール設定フォーム
 * @related PasswordChangeForm - パスワード変更フォーム
 * @issue #38 - マイページ機能の拡張
 */
export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

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
        <h1 className="mb-8 text-2xl font-bold text-gray-900">アカウント設定</h1>

        <div className="space-y-8">
          {/* プロフィール設定セクション */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              プロフィール設定
            </h2>
            <ProfileSettingsForm 
              initialName={session.user.name || ''}
              email={session.user.email!}
            />
          </div>

          {/* パスワード変更セクション */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              パスワード変更
            </h2>
            <PasswordChangeForm userId={session.user.id!} />
          </div>
        </div>
      </div>
    </div>
  )
}