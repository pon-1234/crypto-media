import type { FC } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { dompurifyConfig } from '@/config/dompurify'

/**
 * microCMSのRichText（HTML）を安全に表示するコンポーネント
 * 
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

interface RichTextRendererProps {
  /**
   * 表示するHTMLコンテンツ
   */
  content: string
  /**
   * 追加のCSSクラス名
   */
  className?: string
}

export const RichTextRenderer: FC<RichTextRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  // XSS対策のためDOMPurifyでサニタイズ
  const sanitizedContent = DOMPurify.sanitize(content, dompurifyConfig)

  return (
    <div
      className={`prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}