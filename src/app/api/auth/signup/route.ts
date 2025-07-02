import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { z } from 'zod'

/**
 * アカウント作成API
 *
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB - Firebaseへのユーザー情報保存
 * @related src/lib/auth/password.ts - パスワードのハッシュ化
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

// リクエストボディのバリデーションスキーマ
const signupSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  name: z.string().min(1, '名前を入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json()

    // バリデーション
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = validationResult.data

    // パスワード強度チェック
    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        { error: passwordStrength.errors.join(', ') },
        { status: 400 }
      )
    }

    // メールアドレスの重複チェック
    const existingUser = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password)

    // Firestoreにユーザー情報を保存
    const newUser = {
      email,
      name,
      passwordHash,
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const userRef = await adminDb.collection('users').add(newUser)

    // 成功レスポンス（パスワードハッシュは含めない）
    return NextResponse.json({
      user: {
        id: userRef.id,
        email,
        name,
      },
      message: 'アカウントが正常に作成されました',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'アカウント作成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
