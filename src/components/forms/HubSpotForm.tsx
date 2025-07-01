'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

/**
 * HubSpotフォーム埋め込みコンポーネント
 * @doc https://knowledge.hubspot.com/forms/embed-forms-on-external-pages
 * @related ContactPage - お問い合わせページで使用
 * @issue #13 - HubSpotフォーム統合
 */

// HubSpotグローバルオブジェクトの型定義は src/types/hubspot.d.ts で定義
interface HubSpotFormProps {
  /** HubSpotポータルID */
  portalId: string
  /** フォームID */
  formId: string
  /** フォームを埋め込むターゲット要素のID */
  targetId?: string
  /** フォーム送信成功時のコールバック */
  onFormSubmitted?: () => void
  /** カスタムクラス名 */
  className?: string
}

export function HubSpotForm({
  portalId,
  formId,
  targetId = 'hubspot-form',
  onFormSubmitted,
  className,
}: HubSpotFormProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // HubSpotフォームライブラリがロードされているか確認
    if (typeof window !== 'undefined' && window.hbspt && isScriptLoaded) {
      try {
        window.hbspt.forms.create({
          portalId,
          formId,
          target: `#${targetId}`,
          onFormSubmitted: () => {
            onFormSubmitted?.()
          },
        })
      } catch (error) {
        console.error('HubSpotフォームの作成に失敗しました:', error)
        setHasError(true)
      }
    }
  }, [portalId, formId, targetId, onFormSubmitted, isScriptLoaded])

  return (
    <>
      <Script
        id="hubspot-script"
        src="//js.hsforms.net/forms/embed/v2.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => {
          console.error('HubSpotスクリプトの読み込みに失敗しました')
          setHasError(true)
        }}
      />
      {hasError ? (
        <div
          className={`rounded border border-yellow-400 bg-yellow-50 px-4 py-3 text-yellow-800 ${className || ''}`}
        >
          <p className="font-semibold">フォームの読み込みに失敗しました</p>
          <p className="mt-1 text-sm">
            お手数ですが、ページを再読み込みするか、
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@example.com'}`}
              className="underline"
            >
              メールでお問い合わせ
            </a>
            ください。
          </p>
        </div>
      ) : (
        <div id={targetId} className={className} />
      )}
    </>
  )
}
