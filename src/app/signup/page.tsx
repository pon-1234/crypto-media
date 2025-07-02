'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { validatePasswordStrength } from '@/lib/auth/password'

/**
 * 新規アカウント登録ページ
 *
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB - メール/パスワードによるアカウント作成
 * @related src/app/api/auth/signup/route.ts - アカウント作成API
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */
export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // パスワード強度をリアルタイムで検証
    if (name === 'password') {
      const { errors } = validatePasswordStrength(value)
      setPasswordErrors(errors)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // パスワード強度を検証
    const { isValid, errors } = validatePasswordStrength(formData.password)
    if (!isValid) {
      setError('パスワードが要件を満たしていません')
      setPasswordErrors(errors)
      setIsLoading(false)
      return
    }

    // パスワード確認
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      setIsLoading(false)
      return
    }

    try {
      // アカウント作成APIを呼び出し
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アカウント作成に失敗しました')
      }

      // 作成成功後、自動でログイン
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('アカウントは作成されましたが、ログインに失敗しました')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        router.push('/media/mypage')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError(
        error instanceof Error
          ? error.message
          : '予期しないエラーが発生しました'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
            新規アカウント登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            メールアドレスとパスワードでアカウントを作成
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                お名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="山田 太郎"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="パスワード"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {passwordErrors.length > 0 && (
                <div className="mt-2">
                  <ul className="space-y-1 text-xs text-red-600">
                    {passwordErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {formData.password && passwordErrors.length === 0 && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ パスワードは要件を満たしています
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="パスワード（確認）"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    パスワードが一致しません
                  </p>
                )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md bg-gray-50 p-4">
            <p className="text-xs text-gray-600">パスワードの要件：</p>
            <ul className="mt-1 space-y-1 text-xs text-gray-500">
              <li>• 8文字以上</li>
              <li>• 大文字・小文字を含む</li>
              <li>• 数字を含む</li>
              <li>• 特殊文字（!@#$%^&*など）を含む</li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? '作成中...' : 'アカウントを作成'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              すでにアカウントをお持ちの方は
            </span>
            <Link
              href="/login"
              className="ml-1 font-medium text-indigo-600 hover:text-indigo-500"
            >
              ログイン
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              アカウントを作成することで、
              <Link
                href="/terms"
                className="text-indigo-600 hover:text-indigo-500"
              >
                利用規約
              </Link>
              および
              <Link
                href="/privacy-policy"
                className="text-indigo-600 hover:text-indigo-500"
              >
                プライバシーポリシー
              </Link>
              に同意したものとみなされます。
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
