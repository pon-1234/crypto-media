import bcryptjs from 'bcryptjs'

/**
 * パスワードのハッシュ化と検証に関するユーティリティ
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB - パスワード認証のセキュリティ実装
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

/**
 * パスワードをハッシュ化する
 * @param password プレーンテキストのパスワード
 * @returns ハッシュ化されたパスワード
 * @security-note 本番環境では必ずsaltRounds=10を使用してセキュリティを確保
 */
export async function hashPassword(password: string): Promise<string> {
  // テスト環境では処理を高速化するためsaltRoundsを減らす
  // 本番環境のセキュリティには影響しない
  // @security-note: 本番環境では必ずsaltRounds=10を使用
  const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10
  return bcryptjs.hash(password, saltRounds)
}

/**
 * パスワードを検証する
 * @param password プレーンテキストのパスワード
 * @param hashedPassword ハッシュ化されたパスワード
 * @returns パスワードが一致する場合はtrue
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword)
}

/**
 * パスワードの強度を検証する
 * @param password パスワード
 * @returns 検証結果
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('パスワードは8文字以上で入力してください')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('大文字を1文字以上含めてください')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('小文字を1文字以上含めてください')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('数字を1文字以上含めてください')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('特殊文字を1文字以上含めてください')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
