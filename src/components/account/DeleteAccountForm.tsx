'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { deleteAccount } from '@/app/actions/account'

interface DeleteAccountFormProps {
  userId: string
  userEmail: string
  hasPaidMembership: boolean
}

/**
 * アカウント削除フォームコンポーネント
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related /api/account/delete - アカウント削除API
 * @issue #38 - マイページ機能の拡張
 */
export function DeleteAccountForm({ 
  userId, 
  userEmail,
  hasPaidMembership 
}: DeleteAccountFormProps) {
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const canDelete = 
    confirmEmail === userEmail && 
    confirmText === '削除する'

  const handleDelete = async () => {
    if (!canDelete || !password) {
      toast.error('必要事項を入力してください')
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteAccount(userId, {
          password,
          reason,
          hasPaidMembership,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('アカウントを削除しました')
        
        // サインアウトしてトップページへリダイレクト
        await signOut({ callbackUrl: '/' })
      } catch (error) {
        console.error('Account deletion error:', error)
        toast.error('アカウントの削除に失敗しました')
      }
    })
  }

  return (
    <div className="space-y-6">
      {hasPaidMembership && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                有料会員プランは自動的に解約され、日割り計算による返金は行われません
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label 
          htmlFor="reason" 
          className="block text-sm font-medium text-gray-700"
        >
          退会理由（任意）
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="サービス改善のため、退会理由をお聞かせください"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          rows={3}
          disabled={isPending}
        />
      </div>

      <div>
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-gray-700"
        >
          パスワード <span className="text-red-600">*</span>
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="本人確認のため、パスワードを入力してください"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          disabled={isPending}
          required
        />
      </div>

      <div>
        <label 
          htmlFor="confirmEmail" 
          className="block text-sm font-medium text-gray-700"
        >
          確認のため、登録メールアドレスを入力してください <span className="text-red-600">*</span>
        </label>
        <input
          type="email"
          id="confirmEmail"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder={userEmail}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          disabled={isPending}
        />
      </div>

      <div>
        <label 
          htmlFor="confirmText" 
          className="block text-sm font-medium text-gray-700"
        >
          「削除する」と入力してください <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="confirmText"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="削除する"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          disabled={isPending}
        />
      </div>

      <div className="border-t pt-6">
        <Button
          onClick={handleDelete}
          disabled={!canDelete || !password || isPending}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300"
        >
          {isPending ? '削除中...' : 'アカウントを削除する'}
        </Button>
        
        <p className="mt-4 text-center text-sm text-gray-500">
          この操作は取り消すことができません
        </p>
      </div>
    </div>
  )
}