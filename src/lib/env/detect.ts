/**
 * 環境検出ユーティリティ
 * @doc 各種環境（CI、テスト、開発、本番）を検出するためのユーティリティ関数
 * @related src/config/env.ts - 環境変数の設定
 * @related src/lib/auth/authOptions.ts - 認証設定での環境判定
 */

/**
 * CI環境かどうかを判定
 * @returns CI環境の場合はtrue
 */
export function isCI(): boolean {
  return process.env.CI === 'true'
}

/**
 * テスト環境かどうかを判定
 * @returns テスト環境の場合はtrue
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test' || !!process.env.VITEST
}

/**
 * 開発環境かどうかを判定
 * @returns 開発環境の場合はtrue
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 本番環境かどうかを判定
 * @returns 本番環境の場合はtrue
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * サーバーサイドかどうかを判定
 * @returns サーバーサイドの場合はtrue
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * クライアントサイドかどうかを判定
 * @returns クライアントサイドの場合はtrue
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * テスト環境またはCI環境かどうかを判定
 * @returns テスト環境またはCI環境の場合はtrue
 */
export function isTestOrCI(): boolean {
  return isTest() || isCI()
}

/**
 * 環境情報を取得
 * @returns 環境情報オブジェクト
 */
export function getEnvironmentInfo() {
  return {
    isCI: isCI(),
    isTest: isTest(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isServer: isServer(),
    isClient: isClient(),
    nodeEnv: process.env.NODE_ENV || 'development',
  }
}