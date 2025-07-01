import { Metadata } from 'next'
import { HubSpotForm } from '@/components/forms/HubSpotForm'

/**
 * コーポレートサイトのお問い合わせページ
 * @doc https://github.com/pon-1234/crypto-media/issues/13
 * @related HubSpotForm - フォーム埋め込みコンポーネント
 * @issue #13 - HubSpotフォーム統合
 */
export const metadata: Metadata = {
  title: 'お問い合わせ | 株式会社Example',
  description: 'お問い合わせはこちらのフォームからお願いいたします。',
}

export default function ContactPage() {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''
  const formId = process.env.NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID || ''

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">お問い合わせ</h1>

        <div className="prose prose-lg mb-8">
          <p>
            お問い合わせは下記フォームよりお願いいたします。
            内容を確認の上、担当者より折り返しご連絡させていただきます。
          </p>
          <p className="text-sm text-gray-600">
            ※ 通常、2営業日以内にご返信いたします。
          </p>
        </div>

        {portalId && formId ? (
          <div className="rounded-lg bg-gray-50 p-8">
            <HubSpotForm
              portalId={portalId}
              formId={formId}
              targetId="corporate-contact-form"
              className="hubspot-form-container"
              onFormSubmitted={() => {
                // フォーム送信成功時の処理（必要に応じて実装）
                console.log('お問い合わせフォームが送信されました')
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
              NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID を設定してください。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
