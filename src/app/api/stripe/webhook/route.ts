import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase/admin'
import { isStripeIp, logWebhookEvent, WebhookTimer } from '@/lib/stripe/webhook-security'
import Stripe from 'stripe'

/**
 * Stripe Webhookエンドポイント
 * 
 * @doc DEVELOPMENT_GUIDE.md#Stripe決済フロー - Webhook処理
 * @related src/lib/stripe/client.ts - Stripe SDKクライアント
 * @related src/lib/firebase/admin.ts - Firebase Admin SDK
 * @issue #8 - Stripe CheckoutとWebhookの実装
 */

// Rate limiting用のメモリストア（本番環境ではRedisを推奨）
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Rate limiting関数
function checkRateLimit(ip: string | null): boolean {
  if (!ip) return true // IPが取得できない場合は制限しない
  
  const now = Date.now()
  const limit = requestCounts.get(ip)
  
  if (!limit || now > limit.resetTime) {
    // 新しい期間の開始（1分間で最大10リクエスト）
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 })
    return true
  }
  
  if (limit.count >= 10) {
    return false // Rate limit exceeded
  }
  
  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  const timer = new WebhookTimer();
  
  // IP検証（本番環境のみ）
  if (!isStripeIp(request)) {
    logWebhookEvent({
      eventId: 'unknown',
      eventType: 'unknown',
      livemode: false,
      receivedAt: new Date().toISOString(),
      success: false,
      error: 'Invalid source IP',
    });
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }
  
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Stripe署名の検証
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // 冪等性チェック - 同じイベントIDが既に処理されていないか確認
  const eventRef = adminDb.collection('webhook_events').doc(event.id)
  
  try {
    // トランザクションで冪等性を保証
    const processed = await adminDb.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef)
      
      if (eventDoc.exists) {
        console.log(`Event ${event.id} already processed`)
        return true // 既に処理済み
      }
      
      // イベントを記録
      transaction.set(eventRef, {
        type: event.type,
        created: event.created,
        processed_at: new Date().toISOString(),
        livemode: event.livemode,
      })
      
      return false // 新規イベント
    })
    
    if (processed) {
      return NextResponse.json({ received: true })
    }
  } catch (error) {
    console.error('Idempotency check failed:', error)
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    )
  }

  try {
    // イベントタイプに応じた処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode !== 'subscription') {
          console.log('Not a subscription checkout, skipping')
          break
        }

        const userId = session.metadata?.userId
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!userId) {
          console.error('No userId in session metadata')
          break
        }

        // トランザクションでユーザー情報を更新
        await adminDb.runTransaction(async (transaction) => {
          const userRef = adminDb.collection('users').doc(userId)
          const userDoc = await transaction.get(userRef)
          
          if (!userDoc.exists) {
            console.error(`User ${userId} not found`)
            return
          }
          
          const userData = userDoc.data()
          
          // 既存の有料会員チェック
          if (userData?.membership === 'paid' && userData?.stripeSubscriptionId) {
            console.warn(`User ${userId} already has an active subscription: ${userData.stripeSubscriptionId}`)
            // 既存のサブスクリプションをキャンセルまたはログに記録
            logWebhookEvent({
              eventId: event.id,
              eventType: 'duplicate_subscription_attempt',
              livemode: event.livemode || false,
              receivedAt: new Date().toISOString(),
              success: false,
              error: 'User already has active subscription',
              metadata: {
                userId,
                existingSubscriptionId: userData.stripeSubscriptionId,
                newSubscriptionId: subscriptionId,
              }
            })
            return
          }
          
          transaction.update(userRef, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            membership: 'paid',
            membershipUpdatedAt: new Date().toISOString(),
          })
        })

        console.log(`User ${userId} upgraded to paid membership`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // メタデータからuserIdを取得（効率的な検索のため）
        const userId = subscription.metadata?.userId
        
        if (!userId) {
          // フォールバック: Firestoreでサブスクリプションから検索
          const userSnapshot = await adminDb
            .collection('users')
            .where('stripeSubscriptionId', '==', subscription.id)
            .limit(1)
            .get()

          if (userSnapshot.empty) {
            console.error(`No user found for subscription ${subscription.id}`)
            break
          }
          
          const userDoc = userSnapshot.docs[0]
          const updates: Record<string, string> = {
            membershipUpdatedAt: new Date().toISOString(),
          }
          
          // ステータスに応じた更新
          if (subscription.status === 'active') {
            updates.membership = 'paid'
          } else if (subscription.status === 'past_due') {
            // 支払い遅延の場合も一旦有料会員を維持（ビジネス判断）
            updates.membership = 'paid'
            updates.paymentStatus = 'past_due'
          } else if (['canceled', 'unpaid'].includes(subscription.status)) {
            updates.membership = 'free'
            updates.paymentStatus = subscription.status
          }
          
          await userDoc.ref.update(updates)
        } else {
          // userIdがある場合の高速処理
          const userRef = adminDb.collection('users').doc(userId)
          const updates: Record<string, string> = {
            membershipUpdatedAt: new Date().toISOString(),
          }
          
          if (subscription.status === 'active') {
            updates.membership = 'paid'
            updates.paymentStatus = 'active'
          } else if (subscription.status === 'past_due') {
            updates.membership = 'paid'
            updates.paymentStatus = 'past_due'
          } else if (['canceled', 'unpaid'].includes(subscription.status)) {
            updates.membership = 'free'
            updates.paymentStatus = subscription.status
          }
          
          await userRef.update(updates)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        
        if (userId) {
          // 高速処理
          await adminDb.collection('users').doc(userId).update({
            membership: 'free',
            membershipUpdatedAt: new Date().toISOString(),
            stripeSubscriptionId: null,
            paymentStatus: 'canceled',
          })
        } else {
          // フォールバック検索
          const userSnapshot = await adminDb
            .collection('users')
            .where('stripeSubscriptionId', '==', subscription.id)
            .limit(1)
            .get()

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0]
            await userDoc.ref.update({
              membership: 'free',
              membershipUpdatedAt: new Date().toISOString(),
              stripeSubscriptionId: null,
              paymentStatus: 'canceled',
            })
          }
        }
        
        console.log(`Subscription ${subscription.id} canceled, user changed to free membership`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        const customerId = invoice.customer as string
        
        if (subscriptionId) {
          console.error(`Payment failed for subscription ${subscriptionId}`)
          
          // 支払い失敗イベントを記録
          await adminDb.collection('payment_failures').add({
            subscriptionId,
            customerId,
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            failedAt: new Date().toISOString(),
            attemptCount: invoice.attempt_count,
          })
          
          // TODO: メール通知の実装
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // 成功ログ
    logWebhookEvent({
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode || false,
      receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      success: true,
    });
    
    timer.logDuration(event.type);
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // エラーログ
    logWebhookEvent({
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode || false,
      receivedAt: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // エラーが発生した場合、イベントを削除して再試行可能にする
    await eventRef.delete().catch(console.error)
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

