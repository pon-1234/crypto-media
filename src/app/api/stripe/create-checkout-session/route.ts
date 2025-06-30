import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { stripe, MONTHLY_PRICE_ID } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase/admin'

/**
 * Stripe Checkoutセッション作成APIルート
 * 
 * @doc DEVELOPMENT_GUIDE.md#Stripe決済フロー
 * @related src/app/register/page.tsx - このAPIを呼び出す登録ページ
 * @related src/lib/stripe/client.ts - Stripe SDKクライアント
 * @issue #8 - Stripe CheckoutとWebhookの実装
 */
export async function POST() {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // Price IDのチェック
    if (!MONTHLY_PRICE_ID) {
      console.error('STRIPE_MONTHLY_PRICE_ID is not configured')
      return NextResponse.json(
        { error: 'サーバーの設定エラーです' },
        { status: 500 }
      )
    }

    // FirestoreからユーザーのStripe顧客IDを取得
    let customerId: string | undefined
    try {
      const userDoc = await adminDb.collection('users').doc(session.user.id).get()
      const userData = userDoc.data()
      
      if (userData?.stripeCustomerId) {
        customerId = userData.stripeCustomerId
        
        // 既存のアクティブなサブスクリプションがあるか確認
        if (userData.membership === 'paid' && userData.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'すでに有料会員です' },
            { status: 400 }
          )
        }
      } else {
        // Stripeに顧客が存在するか確認（キャッシュミス時のフォールバック）
        const customers = await stripe.customers.list({
          email: session.user.email,
          limit: 1,
        })

        if (customers.data.length > 0) {
          customerId = customers.data[0].id
          
          // FirestoreにcustomerIdをキャッシュ
          await userDoc.ref.update({
            stripeCustomerId: customerId,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // エラーが発生しても処理を継続（新規顧客として扱う）
    }

    // Checkoutセッションを作成
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : session.user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/media/mypage/membership?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/register?canceled=true`,
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email,
      },
      // 日本の消費者向け設定
      billing_address_collection: 'required',
      locale: 'ja',
      allow_promotion_codes: true,
      // 重複購入を防ぐ
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    
    // Stripeエラーの詳細なハンドリング
    if (error instanceof Error) {
      // Stripeの型エラーを正しく処理
      const stripeError = error as Error & { type?: string }
      
      if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'リクエストが無効です' },
          { status: 400 }
        )
      } else if (stripeError.type === 'StripeAPIError') {
        return NextResponse.json(
          { error: 'Stripeサービスに問題が発生しました' },
          { status: 502 }
        )
      } else if (stripeError.type === 'StripeConnectionError') {
        return NextResponse.json(
          { error: 'Stripeへの接続に失敗しました' },
          { status: 503 }
        )
      } else if (stripeError.type === 'StripeAuthenticationError') {
        console.error('Stripe authentication error - check API keys')
        return NextResponse.json(
          { error: 'サーバーの設定エラーです' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Checkoutセッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}