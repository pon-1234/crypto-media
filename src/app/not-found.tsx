/**
 * 404エラーページ
 * @doc https://example.co.jp/docs/error-pages
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import Link from 'next/link';
import { SITE_CONFIG } from '@/config';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <p className="text-2xl font-semibold text-gray-900 mt-4">
            ページが見つかりません
          </p>
          <p className="text-gray-600 mt-2">
            お探しのページは、移動または削除された可能性があります。
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={SITE_CONFIG.urls.corporate.top}
            className="block w-full px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            コーポレートサイトへ
          </Link>
          <Link
            href={SITE_CONFIG.urls.media.top}
            className="block w-full px-6 py-3 text-base font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
  );
}