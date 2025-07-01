/**
 * 404エラーページ
 * @doc https://example.co.jp/docs/error-pages
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import Link from 'next/link'
import { SITE_CONFIG } from '@/config'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4 text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            ページが見つかりません
          </p>
          <p className="mt-2 text-gray-600">
            お探しのページは、移動または削除された可能性があります。
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={SITE_CONFIG.urls.corporate.top}
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
          >
            コーポレートサイトへ
          </Link>
          <Link
            href={SITE_CONFIG.urls.media.top}
            className="block w-full rounded-lg bg-blue-50 px-6 py-3 text-base font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            メディアサイトへ
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            引き続きお困りの場合は、
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
