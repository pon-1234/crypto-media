import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { generateResetToken, saveResetToken } from '@/lib/auth/reset-token'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/sendgrid'
import { env } from '@/config'

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

/**
 * パスワードリセットメールのHTMLテンプレートを生成する
 * @param resetUrl パスワードリセット用のURL
 * @returns HTML文字列
 */
const createPasswordResetEmailHtml = (resetUrl: string): string => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>パスワードリセットのご案内</h2>
      <p>パスワードをリセットするには、下記のボタンをクリックしてください。</p>
      <p style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #0070f3; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          パスワードをリセット
        </a>
      </p>
      <p>このリンクは1時間有効です。</p>
      <p>このメールに心当たりがない場合は、無視してください。</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;">
      <p style="color: #666; font-size: 14px;">
        このメールは自動送信されています。返信はできません。
      </p>
    </div>
  `
}

// 成功レスポンスのメッセージを定数化
const SUCCESS_MESSAGE = 'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）'

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
        message: SUCCESS_MESSAGE,
      })
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // パスワードハッシュが存在しない場合（Googleログインのみのユーザー）
    if (!userData.passwordHash) {
      return NextResponse.json({
        message: SUCCESS_MESSAGE,
      })
    }

    // リセットトークンを生成
    const token = generateResetToken()

    // トークンをFirestoreに保存
    await saveResetToken(email, token)

    // パスワードリセットメールを送信
    const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${token}`
    
    try {
      await sendEmail({
        to: email,
        subject: 'パスワードリセットのご案内',
        text: `パスワードをリセットするには、次のリンクをクリックしてください: ${resetUrl}`,
        html: createPasswordResetEmailHtml(resetUrl),
      })
    } catch (error) {
      // メール送信に失敗しても、セキュリティのためユーザーには成功レスポンスを返す
      console.error('Failed to send password reset email:', error)
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGE,
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