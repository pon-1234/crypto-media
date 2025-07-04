'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { changePassword } from '@/app/actions/account'

interface PasswordChangeFormProps {
  userId: string
}

/**
 * パスワード変更フォームコンポーネント
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related /api/account/password - パスワード変更API
 * @issue #38 - マイページ機能の拡張
 */
export function PasswordChangeForm({ userId }: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'パスワードは8文字以上で入力してください'
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return 'パスワードは英数字を含む必要があります'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('すべての項目を入力してください')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('新しいパスワードは現在のパスワードと異なる必要があります')
      return
    }

    startTransition(async () => {
      try {
        const result = await changePassword(userId, {
          currentPassword,
          newPassword,
          confirmPassword,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('パスワードを変更しました')

        // フォームをリセット
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } catch (error) {
        console.error('Password change error:', error)
        toast.error('パスワードの変更に失敗しました')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-gray-700"
        >
          現在のパスワード
        </label>
        <div className="relative mt-1">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700"
        >
          新しいパスワード
        </label>
        <div className="relative mt-1">
          <input
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          8文字以上の英数字を含むパスワードを入力してください
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700"
        >
          新しいパスワード（確認）
        </label>
        <div className="relative mt-1">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-w-[120px]">
          {isPending ? '変更中...' : '変更する'}
        </Button>
      </div>
    </form>
  )
}
