/**
 * プレビューAPIエンドポイント
 * 
 * microCMSのプレビュー機能から呼び出され、Next.jsのプレビューモードを有効化します。
 * 
 * @doc DEVELOPMENT_GUIDE.md#プレビュー機能
 * @issue #24 - プレビュー機能の実装
 */
import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'
import { z } from 'zod'
import crypto from 'crypto'

/**
 * プレビューリクエストのパラメータスキーマ
 */
const previewParamsSchema = z.object({
  contentId: z.string().min(1),
  draftKey: z.string().min(1),
  endpoint: z.enum(['media_articles', 'corporate_news']),
})

/**
 * draftKeyの検証
 * 
 * microCMSから送信されるdraftKeyが正当なものかを検証します。
 * 環境変数MICROCMS_PREVIEW_SECRETを使用してHMACで署名を検証します。
 * 
 * @param contentId - コンテンツID
 * @param draftKey - microCMSから送信されるdraftKey
 * @returns 検証結果
 */
function validateDraftKey(contentId: string, draftKey: string): boolean {
  const secret = process.env.MICROCMS_PREVIEW_SECRET
  
  // 環境変数が設定されていない場合は、開発環境として常に許可
  if (!secret) {
    console.warn('MICROCMS_PREVIEW_SECRET is not set. Preview mode is insecure.')
    return process.env.NODE_ENV === 'development'
  }
  
  // HMACを使用して期待されるdraftKeyを生成
  const expectedKey = crypto
    .createHmac('sha256', secret)
    .update(contentId)
    .digest('hex')
  
  // タイミング攻撃を防ぐため、crypto.timingSafeEqualを使用
  // バッファ長が異なる場合は即座にfalseを返す
  const draftKeyBuffer = Buffer.from(draftKey)
  const expectedKeyBuffer = Buffer.from(expectedKey)
  
  if (draftKeyBuffer.length !== expectedKeyBuffer.length) {
    return false
  }
  
  return crypto.timingSafeEqual(draftKeyBuffer, expectedKeyBuffer)
}

/**
 * GETリクエストハンドラー
 * 
 * microCMSのプレビューボタンから呼び出されます。
 * 
 * @param request - NextRequest
 * @returns プレビューページへのリダイレクトまたはエラーレスポンス
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  try {
    // パラメータの検証
    const params = previewParamsSchema.parse({
      contentId: searchParams.get('contentId'),
      draftKey: searchParams.get('draftKey'),
      endpoint: searchParams.get('endpoint'),
    })
    
    // draftKeyの検証
    if (!validateDraftKey(params.contentId, params.draftKey)) {
      return NextResponse.json(
        { error: 'Invalid draft key' },
        { status: 403 }
      )
    }

    // プレビューモードを有効化
    const draft = await draftMode()
    draft.enable()

    // エンドポイントに応じたリダイレクト先を決定
    let redirectUrl: string
    switch (params.endpoint) {
      case 'media_articles':
        // スラッグを使用する場合は、microCMSからスラッグを取得する必要があるが、
        // プレビュー時はIDベースでのアクセスも可能にする
        redirectUrl = `/media/articles/${params.contentId}?draftKey=${params.draftKey}`
        break
      case 'corporate_news':
        redirectUrl = `/news/${params.contentId}?draftKey=${params.draftKey}`
        break
      default:
        throw new Error('Invalid endpoint')
    }

    // プレビューページへリダイレクト
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch (error) {
    console.error('Preview API error:', error)
    
    // エラーレスポンス
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to enable preview mode' },
      { status: 500 }
    )
  }
}