import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { adminDb } from '@/lib/firebase/admin'
import { z } from 'zod'

/**
 * プロフィール更新リクエストのスキーマ
 */
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください'),
})

/**
 * プロフィール更新API
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related ProfileSettingsForm - プロフィール設定フォーム
 * @issue #38 - マイページ機能の拡張
 */
export async function PATCH(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }

    // リクエストボディの検証
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Firestoreのユーザードキュメントを更新
    await adminDb.collection('users').doc(session.user.id).update({
      name: validatedData.name,
    })

    return NextResponse.json({ message: 'プロフィールを更新しました' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: '入力形式が正しくありません', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('プロフィールの更新に失敗しました:', error)
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}