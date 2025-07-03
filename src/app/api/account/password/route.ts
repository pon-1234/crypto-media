import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { adminDb } from '@/lib/firebase/admin'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { z } from 'zod'
import { rateLimit } from '@/lib/middleware/rate-limit'

/**
 * パスワード変更リクエストのスキーマ
 */
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '現在のパスワードは必須です'),
    newPassword: z
      .string()
      .min(8, '新しいパスワードは8文字以上で入力してください')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        'パスワードは英数字を含む必要があります'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '新しいパスワードが一致しません',
    path: ['confirmPassword'],
  })

/**
 * パスワード変更API
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related PasswordChangeForm - パスワード変更フォーム
 * @issue #38 - マイページ機能の拡張
 */
export async function PATCH(request: NextRequest) {
  try {
    // レート制限チェック（パスワード変更は1分に5回まで）
    const rateLimitResult = await rateLimit(request, {
      windowMs: 60 * 1000, // 1分
      max: 5,
      keyPrefix: 'password-change',
    })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'パスワード変更の試行回数が制限を超えました。しばらく待ってから再試行してください。',
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)),
          },
        }
      )
    }
    
    // セッション確認
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }

    // リクエストボディの検証
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // ユーザー情報を取得
    const userDoc = await adminDb.collection('users').doc(session.user.id).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    // 現在のパスワードを検証
    if (!userData?.passwordHash) {
      return NextResponse.json(
        { message: 'パスワードが設定されていません。' },
        { status: 400 }
      )
    }

    const isValid = await verifyPassword(
      validatedData.currentPassword,
      userData.passwordHash
    )
    if (!isValid) {
      return NextResponse.json(
        { message: '現在のパスワードが違います' },
        { status: 400 }
      )
    }

    // 新しいパスワードをハッシュ化
    const newPasswordHash = await hashPassword(validatedData.newPassword)

    // パスワードを更新
    await adminDb.collection('users').doc(session.user.id).update({
      passwordHash: newPasswordHash,
    })
    
    // 監査ログを記録
    await adminDb.collection('audit_logs').add({
      action: 'password_change',
      userId: session.user.id,
      userEmail: session.user.email || 'unknown',
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: '入力形式が正しくありません', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('パスワードの変更に失敗しました:', error)
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}