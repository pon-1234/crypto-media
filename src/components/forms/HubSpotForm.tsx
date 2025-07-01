'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

/**
 * HubSpotフォーム埋め込みコンポーネント
 * @doc https://knowledge.hubspot.com/forms/embed-forms-on-external-pages
 * @related ContactPage - お問い合わせページで使用
 * @issue #13 - HubSpotフォーム統合
 */

// HubSpotグローバルオブジェクトの型定義
declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: {
          portalId: string
          formId: string
          target: string
          onFormSubmitted?: () => void
        }) => void
      }
    }
  }
}
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
        <div className={`bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded ${className || ''}`}>
          <p className="font-semibold">フォームの読み込みに失敗しました</p>
          <p className="text-sm mt-1">
            お手数ですが、ページを再読み込みするか、
            <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@example.com'}`} className="underline">
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