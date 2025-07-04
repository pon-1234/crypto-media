import { randomBytes } from 'crypto'
import { adminDb } from '@/lib/firebase/admin'

/**
 * パスワードリセットトークンの生成と管理
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB - パスワードリセット機能
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

/**
 * セキュアなランダムトークンを生成する
 * @returns 32バイトのランダムトークン（64文字の16進数文字列）
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * パスワードリセットトークンを保存する
 * @param email ユーザーのメールアドレス
 * @param token リセットトークン
 * @param expiresIn トークンの有効期限（ミリ秒）デフォルトは1時間
 */
export async function saveResetToken(
  email: string,
  token: string,
  expiresIn: number = 60 * 60 * 1000 // 1時間
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn)

  await adminDb.collection('passwordResetTokens').doc(token).set({
    email,
    token,
    expiresAt,
    used: false,
    createdAt: new Date(),
  })
}

/**
 * パスワードリセットトークンを検証する
 * @param token リセットトークン
 * @returns トークンが有効な場合はメールアドレス、無効な場合はnull
 */
export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const doc = await adminDb.collection('passwordResetTokens').doc(token).get()

    if (!doc.exists) {
      return null
    }

    const data = doc.data()!

    // トークンが使用済みの場合
    if (data.used) {
      return null
    }

    // トークンが期限切れの場合
    if (data.expiresAt.toDate() < new Date()) {
      return null
    }

    return data.email
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return null
  }
}

/**
 * パスワードリセットトークンを使用済みにする
 * @param token リセットトークン
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  await adminDb.collection('passwordResetTokens').doc(token).update({
    used: true,
    usedAt: new Date(),
  })
}

/**
 * 期限切れのトークンをクリーンアップする
 * @returns 削除されたトークンの数
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const now = new Date()
  const expiredTokens = await adminDb
    .collection('passwordResetTokens')
    .where('expiresAt', '<', now)
    .get()

  const batch = adminDb.batch()
  expiredTokens.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  await batch.commit()
  return expiredTokens.size
}
