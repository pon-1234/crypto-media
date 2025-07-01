import { Metadata } from 'next'
import { HubSpotForm } from '@/components/forms/HubSpotForm'

/**
 * メディアサイトのお問い合わせページ
 * @doc https://github.com/pon-1234/crypto-media/issues/13
 * @related HubSpotForm - フォーム埋め込みコンポーネント
 * @issue #13 - HubSpotフォーム統合
 */
export const metadata: Metadata = {
  title: 'お問い合わせ | Crypto Media',
  description:
    'Crypto Mediaへのお問い合わせはこちらのフォームからお願いいたします。',
}

export default function MediaContactPage() {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''
  const formId = process.env.NEXT_PUBLIC_HUBSPOT_MEDIA_FORM_ID || ''

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">お問い合わせ</h1>

        <div className="prose prose-lg mb-8">
          <p>
            Crypto Mediaへのお問い合わせは下記フォームよりお願いいたします。
          </p>

          <div className="my-4 border-l-4 border-blue-400 bg-blue-50 p-4">
            <p className="mb-2 font-semibold">お問い合わせ内容例：</p>
            <ul className="list-inside list-disc text-sm">
              <li>記事内容に関するご質問・ご指摘</li>
              <li>取材・執筆のご依頼</li>
              <li>広告掲載のご相談</li>
              <li>会員サービスに関するお問い合わせ</li>
              <li>その他メディアに関するご意見・ご要望</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            ※ 内容により回答にお時間をいただく場合がございます。
          </p>
        </div>

        {portalId && formId ? (
          <div className="rounded-lg bg-gray-50 p-8">
            <HubSpotForm
              portalId={portalId}
              formId={formId}
              targetId="media-contact-form"
              className="hubspot-form-container"
              onFormSubmitted={() => {
                // フォーム送信成功時の処理（必要に応じて実装）
                console.log('メディアお問い合わせフォームが送信されました')
              }}
            />
          </div>
        ) : (
          <div className="rounded border border-yellow-400 bg-yellow-50 px-4 py-3 text-yellow-800">
            <p className="font-semibold">
              お問い合わせフォームの設定が必要です
            </p>
            <p className="mt-1 text-sm">
              環境変数 NEXT_PUBLIC_HUBSPOT_PORTAL_ID および
              NEXT_PUBLIC_HUBSPOT_MEDIA_FORM_ID を設定してください。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
