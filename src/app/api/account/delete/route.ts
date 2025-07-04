import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { adminDb } from '@/lib/firebase/admin'
import { stripe } from '@/lib/stripe/client'
import { z } from 'zod'
import { rateLimit } from '@/lib/middleware/rate-limit'

/**
 * アカウント削除リクエストのスキーマ
 */
const deleteAccountSchema = z.object({
  userId: z.string().min(1),
  confirmEmail: z.string().email(),
})

/**
 * アカウント削除API
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related DeleteAccountForm - アカウント削除フォーム
 * @issue #38 - マイページ機能の拡張
 */
export async function DELETE(request: NextRequest) {
  try {
    // レート制限チェック（アカウント削除は1時間に3回まで）
    const rateLimitResult = await rateLimit(request, {
      windowMs: 60 * 60 * 1000, // 1時間
      max: 3,
      keyPrefix: 'account-delete',
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message:
            'アカウント削除の試行回数が制限を超えました。しばらく待ってから再試行してください。',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(
              rateLimitResult.reset - Math.floor(Date.now() / 1000)
            ),
          },
        }
      )
    }

    // セッション確認
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }

    // リクエストボディの検証
    const body = await request.json()
    const validatedData = deleteAccountSchema.parse(body)

    // 自分のアカウントのみ削除可能
    if (session.user.id !== validatedData.userId) {
      return NextResponse.json({ message: '権限がありません' }, { status: 403 })
    }

    // メールアドレスの確認
    if (session.user.email !== validatedData.confirmEmail) {
      return NextResponse.json(
        { message: 'メールアドレスが一致しません' },
        { status: 400 }
      )
    }

    // トランザクション処理開始
    const batch = adminDb.batch()

    // 1. メンバーシップ情報を取得してStripeサブスクリプションをキャンセル
    const memberDoc = await adminDb
      .collection('members')
      .doc(validatedData.userId)
      .get()

    if (memberDoc.exists) {
      const memberData = memberDoc.data()

      // Stripeサブスクリプションがある場合はキャンセル
      if (memberData?.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(memberData.stripeSubscriptionId, {
            // 即座にキャンセル（プロレート計算なし）
            prorate: false,
          })
        } catch (stripeError) {
          console.error('Stripe subscription cancellation error:', stripeError)
          // Stripeエラーがあってもアカウント削除は続行
        }
      }

      // メンバーシップドキュメントを削除
      batch.delete(memberDoc.ref)
    }

    // 2. ユーザードキュメントを論理削除（データは保持するが削除フラグを立てる）
    const userRef = adminDb.collection('users').doc(validatedData.userId)
    batch.update(userRef, {
      deletedAt: new Date().toISOString(),
      email: `deleted_${Date.now()}_${session.user.email}`, // メールアドレスを無効化
      name: 'Deleted User',
      passwordHash: null,
      // 個人情報を削除しつつ、監査ログのために最小限の情報は保持
    })

    // 3. セッション関連のドキュメントを削除
    const sessionsSnapshot = await adminDb
      .collection('sessions')
      .where('userId', '==', validatedData.userId)
      .get()

    sessionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // 4. アカウント関連のドキュメントを削除
    const accountsSnapshot = await adminDb
      .collection('accounts')
      .where('userId', '==', validatedData.userId)
      .get()

    accountsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // バッチ処理を実行
    await batch.commit()

    // 監査ログを記録
    await adminDb.collection('audit_logs').add({
      action: 'account_deletion',
      userId: validatedData.userId,
      userEmail: session.user.email,
      timestamp: new Date().toISOString(),
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    })

    return NextResponse.json({
      success: true,
      message: 'アカウントを削除しました',
    })
  } catch (error) {
    console.error('Account deletion error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: '入力データが不正です', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'アカウントの削除に失敗しました' },
      { status: 500 }
    )
  }
}
