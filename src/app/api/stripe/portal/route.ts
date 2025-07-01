import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { getUserMembership } from '@/lib/auth/membership'
import Stripe from 'stripe'

// Stripe SDKの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

/**
 * Stripeカスタマーポータルへのリダイレクト
 *
 * @doc ユーザーをStripeのカスタマーポータルにリダイレクトし、
 * 支払い方法の変更、請求書の確認、サブスクリプションのキャンセルなどを可能にする
 *
 * @related src/app/media/mypage/membership/page.tsx - 呼び出し元ページ
 * @related src/lib/auth/membership.ts - 会員情報取得
 * @issue #10 - 会員マイページとStripeポータルの実装
 */
export async function POST() {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 会員情報を取得
    const membership = await getUserMembership()

    if (!membership) {
      return NextResponse.json(
        { error: 'User membership not found' },
        { status: 404 }
      )
    }

    // Stripeカスタマーが存在しない場合
    if (!membership.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this user' },
        { status: 400 }
      )
    }

    // リターンURLを生成（ポータルから戻ってくる先）
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/media/mypage/membership`

    // Stripeカスタマーポータルセッションを作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.stripeCustomerId,
      return_url: returnUrl,
    })

    // ポータルURLにリダイレクト
    return NextResponse.redirect(portalSession.url)
  } catch (error) {
    console.error('Failed to create portal session:', error)

    // Stripeエラーの場合、詳細なエラー情報を返す
    // instanceof チェックがモックで動作しないため、プロパティの存在で判定
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      'type' in error
    ) {
      const stripeError = error as Error & { statusCode?: number; type: string }
      return NextResponse.json(
        {
          error: 'Failed to create portal session',
          message: stripeError.message,
          type: stripeError.type,
        },
        { status: stripeError.statusCode || 500 }
      )
    }

    // その他のエラー
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GETリクエストもPOSTと同じ処理を行う
 * （フォーム以外からのアクセスにも対応）
 */
export async function GET() {
  return POST()
}
