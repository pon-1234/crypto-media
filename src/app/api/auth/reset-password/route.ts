import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { verifyResetToken, markTokenAsUsed } from '@/lib/auth/reset-token'
import { z } from 'zod'

/**
 * パスワードリセット実行API
 *
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB - パスワードリセット機能
 * @related src/lib/auth/reset-token.ts - トークン検証
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

// リクエストボディのバリデーションスキーマ
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json()

    // バリデーション
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = validationResult.data

    // パスワード強度チェック
    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        { error: passwordStrength.errors.join(', ') },
        { status: 400 }
      )
    }

    // トークンを検証
    const email = await verifyResetToken(token)
    if (!email) {
      return NextResponse.json(
        { error: 'リセットトークンが無効または期限切れです' },
        { status: 400 }
      )
    }

    // ユーザーを検索
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    const userDoc = usersSnapshot.docs[0]

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password)

    // ユーザーのパスワードを更新
    await userDoc.ref.update({
      passwordHash,
      updatedAt: new Date(),
    })

    // トークンを使用済みにする
    await markTokenAsUsed(token)

    return NextResponse.json({
      message: 'パスワードが正常に更新されました',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'パスワードリセット中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
