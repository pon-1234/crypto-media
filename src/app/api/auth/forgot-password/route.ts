import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { generateResetToken, saveResetToken } from '@/lib/auth/reset-token'
import { z } from 'zod'

/**
 * パスワードリセット要求API
 * 
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB - パスワードリセットフロー
 * @related src/lib/auth/reset-token.ts - トークン生成と管理
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

// リクエストボディのバリデーションスキーマ
const forgotPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json()

    // バリデーション
    const validationResult = forgotPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = validationResult.data

    // ユーザーの存在確認
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      // セキュリティのため、ユーザーが存在しなくても成功レスポンスを返す
      return NextResponse.json({
        message: 'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）',
      })
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // パスワードハッシュが存在しない場合（Googleログインのみのユーザー）
    if (!userData.passwordHash) {
      return NextResponse.json({
        message: 'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）',
      })
    }

    // リセットトークンを生成
    const token = generateResetToken()

    // トークンをFirestoreに保存
    await saveResetToken(email, token)

    // TODO: メール送信の実装
    // 現在はEmailProviderの設定が必要なため、コンソールにログを出力
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
    console.log('Password reset link:', resetUrl)
    console.log('Send this link to:', email)

    // 実際の実装では、ここでメールを送信します
    // await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({
      message: 'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）',
      // 開発環境では、リセットURLも返す（本番環境では削除すること）
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'パスワードリセット処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}