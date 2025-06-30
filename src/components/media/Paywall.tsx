import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface PaywallProps {
  /** 記事のタイトル */
  title: string;
  /** プレビューとして表示するコンテンツ（HTMLまたはテキスト） */
  preview: string;
  /** プレビューがHTMLかテキストか */
  isHtml?: boolean;
}

/**
 * ペイウォールコンポーネント
 * 
 * @doc 有料記事に対して、非有料会員（ゲスト・無料会員）向けに
 * プレビューコンテンツと有料会員登録への誘導を表示します。
 * 
 * @related src/app/media/articles/[slug]/page.tsx - 記事詳細ページでの使用
 * @related src/lib/auth/membership.ts - 会員ステータス判定
 */
export function Paywall({ title, preview, isHtml = true }: PaywallProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {/* 記事タイトル */}
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h1>

      {/* プレビューコンテンツ */}
      <div className="mb-8">
        {isHtml ? (
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        ) : (
          <p className="text-lg leading-relaxed text-gray-700">{preview}</p>
        )}
      </div>

      {/* ペイウォール */}
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <Lock className="h-12 w-12 text-gray-400" />
        </div>
        
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          この記事は有料会員限定です
        </h2>
        
        <p className="mb-6 text-gray-600">
          この記事の続きを読むには、有料会員登録が必要です。
          <br />
          月額1,980円で、すべての有料記事をお読みいただけます。
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/register" className="inline-block">
            <Button size="lg" className="w-full sm:w-auto">
              有料会員登録する
            </Button>
          </Link>
          
          <Link href="/login" className="inline-block">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              ログインする
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          ※ すでに有料会員の方は、ログインしてください
        </p>
      </div>

      {/* 有料会員の特典 */}
      <div className="mt-12 rounded-lg bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-blue-900">
          有料会員の特典
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            すべての有料記事が読み放題
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            専門家による深い分析・調査レポート
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            最新の暗号資産・ブロックチェーン情報
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            いつでも解約可能
          </li>
        </ul>
      </div>
    </div>
  );
}