/**
 * プレビューモード終了APIエンドポイント
 * 
 * プレビューモードを無効化し、通常のページ表示に戻します。
 * 
 * @doc DEVELOPMENT_GUIDE.md#プレビュー機能
 * @issue #24 - プレビュー機能の実装
 */
import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

/**
 * 安全なリダイレクトURLを生成
 * 
 * 外部URLへのリダイレクトを防ぐため、以下のルールを適用します：
 * 1. 絶対URLは拒否（同一オリジンでも）
 * 2. プロトコル相対URL（//で始まる）は拒否
 * 3. 相対パスのみ許可
 * 
 * @param redirectUrl - リダイレクト先として指定されたURL
 * @param requestUrl - 現在のリクエストURL
 * @returns 安全なリダイレクトURL
 */
function getSafeRedirectUrl(redirectUrl: string, requestUrl: string): URL {
  const url = new URL(requestUrl)
  
  // 危険なパターンをチェック
  if (
    redirectUrl.startsWith('http://') ||
    redirectUrl.startsWith('https://') ||
    redirectUrl.startsWith('//') ||
    redirectUrl.includes('@') // user:pass@host形式を防ぐ
  ) {
    // 危険なURLの場合はホームへ
    return new URL('/', url.origin)
  }
  
  // 相対パスとして安全に解決
  try {
    return new URL(redirectUrl, url.origin)
  } catch {
    // パースエラーの場合もホームへ
    return new URL('/', url.origin)
  }
}

/**
 * GETリクエストハンドラー
 * 
 * プレビューモードを無効化します。
 * 
 * @param request - NextRequest
 * @returns リダイレクトレスポンス
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  try {
    // プレビューモードを無効化
    const draft = await draftMode()
    draft.disable()

    // リダイレクト先URLを取得（デフォルトはホーム）
    const redirectUrl = searchParams.get('redirect') || '/'

    // 安全なリダイレクトURLを生成
    // 外部URLへのリダイレクトを防ぐため、常に相対パスとして扱う
    const safeRedirectUrl = getSafeRedirectUrl(redirectUrl, request.url)

    // 指定されたページへリダイレクト
    return NextResponse.redirect(safeRedirectUrl)
  } catch (error) {
    console.error('Exit preview API error:', error)
    
    // エラーが発生してもホームへリダイレクト
    return NextResponse.redirect(new URL('/', request.url))
  }
}