import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { authOptions } from '@/lib/auth/authOptions'
import { getUser } from '@/lib/auth/membership'
import { ProfileSettingsForm } from '@/components/account/ProfileSettingsForm'
import { PasswordChangeForm } from '@/components/account/PasswordChangeForm'

export const metadata: Metadata = {
  title: 'プロフィール設定 | Crypto Media',
  description: 'アカウント情報の確認と設定変更',
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const user = await getUser(session.user.id)

  if (!user) {
    redirect('/login')
  }

  const isPasswordProvider = session.user.provider === 'credentials'

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/media/mypage"
        className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        マイページに戻る
      </Link>

      <h1 className="mb-8 text-2xl font-bold">プロフィール設定</h1>

      <div className="space-y-8">
        {/* アカウント情報 */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">アカウント情報</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">メールアドレス</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">会員ステータス</p>
              <p className="font-medium">
                {user.membership === 'paid' ? (
                  <span className="text-green-600">有料会員</span>
                ) : (
                  <span className="text-gray-600">無料会員</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* プロフィール設定フォーム */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">表示名の変更</h2>
          <ProfileSettingsForm currentName={user.name || ''} userId={user.id} />
        </section>

        {/* パスワード変更フォーム */}
        {isPasswordProvider && (
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">パスワードの変更</h2>
            <PasswordChangeForm userId={user.id} />
          </section>
        )}
      </div>
    </div>
  )
}
