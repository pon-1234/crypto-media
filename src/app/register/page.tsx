'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

/**
 * 有料会員登録ページ
 *
 * @doc DEVELOPMENT_GUIDE.md#Stripe決済フロー
 * @related src/app/api/stripe/create-checkout-session/route.ts - Checkoutセッション作成API
 * @issue #8 - Stripe CheckoutとWebhookの実装
 */
export default function RegisterPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (!session) {
      router.push('/login?redirect=/register')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || 'Checkoutセッションの作成に失敗しました'
        )
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Checkout URLが取得できませんでした')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(
        err instanceof Error ? err.message : '予期しないエラーが発生しました'
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-12 text-white">
            <h1 className="text-3xl font-bold">有料会員登録</h1>
            <p className="mt-2 text-blue-100">
              すべての記事を無制限に閲覧できるプレミアムプランです
            </p>
          </div>

          <div className="px-8 py-10">
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                プレミアムプランの特典
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 flex-shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    有料限定記事への無制限アクセス
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 flex-shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    調査レポート・分析記事の全文閲覧
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 flex-shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">新着記事の早期アクセス</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 flex-shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">広告非表示</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">¥1,980</p>
                  <p className="text-gray-500">月額（税込）</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>いつでもキャンセル可能</p>
                  <p>初回請求は登録時</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {status === 'loading' ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                </div>
              ) : session ? (
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      処理中...
                    </>
                  ) : (
                    '今すぐ登録する'
                  )}
                </button>
              ) : (
                <div className="text-center">
                  <p className="mb-4 text-gray-600">
                    有料会員登録にはログインが必要です
                  </p>
                  <Link
                    href="/login?redirect=/register"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-8 py-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    ログインして続ける
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>決済はStripeを通じて安全に処理されます</p>
              <p className="mt-2">
                ご登録いただくと、
                <Link href="/terms" className="text-blue-600 hover:underline">
                  利用規約
                </Link>
                および
                <Link
                  href="/privacy-policy"
                  className="text-blue-600 hover:underline"
                >
                  プライバシーポリシー
                </Link>
                に同意したものとみなされます
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
