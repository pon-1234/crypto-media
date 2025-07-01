/**
 * エラーバウンダリーページ
 * @doc https://example.co.jp/docs/error-pages
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { SITE_CONFIG } from '@/config'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをロギングサービスに送信
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4 text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            エラーが発生しました
          </h1>
          <p className="mt-2 text-gray-600">
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          {process.env.NODE_ENV === 'development' && error.digest && (
            <p className="mt-2 font-mono text-xs text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
          >
            もう一度試す
          </button>
          <Link
            href={SITE_CONFIG.urls.corporate.top}
            className="block w-full rounded-lg bg-blue-50 px-6 py-3 text-base font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            トップページへ戻る
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            問題が解決しない場合は、
            <Link
              href={SITE_CONFIG.urls.corporate.contact}
              className="text-blue-600 hover:underline"
            >
              お問い合わせ
            </Link>
            ください。
          </p>
        </div>
      </div>
    </div>
  )
}
