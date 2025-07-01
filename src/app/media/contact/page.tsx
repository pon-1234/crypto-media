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
  description: 'Crypto Mediaへのお問い合わせはこちらのフォームからお願いいたします。',
}

export default function MediaContactPage() {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''
  const formId = process.env.NEXT_PUBLIC_HUBSPOT_MEDIA_FORM_ID || ''

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">お問い合わせ</h1>
        
        <div className="prose prose-lg mb-8">
          <p>
            Crypto Mediaへのお問い合わせは下記フォームよりお願いいたします。
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
            <p className="font-semibold mb-2">お問い合わせ内容例：</p>
            <ul className="list-disc list-inside text-sm">
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
          <div className="bg-gray-50 p-8 rounded-lg">
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
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
            <p className="font-semibold">お問い合わせフォームの設定が必要です</p>
            <p className="text-sm mt-1">
              環境変数 NEXT_PUBLIC_HUBSPOT_PORTAL_ID および NEXT_PUBLIC_HUBSPOT_MEDIA_FORM_ID を設定してください。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}