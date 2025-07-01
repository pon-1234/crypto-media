/**
 * 環境変数のバリデーションと型定義
 * @doc https://example.co.jp/docs/env-config
 * @related site.ts - サイト全体の定数設定
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { z } from 'zod'

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  // Node環境
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Firebase設定（クライアント）
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),

  // Firebase Admin SDK設定（サーバー）
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1),

  // microCMS設定
  MICROCMS_SERVICE_DOMAIN: z.string().min(1),
  MICROCMS_API_KEY: z.string().min(1),

  // Stripe設定
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),

  // NextAuth設定
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),

  // Google OAuth設定
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // メール送信設定（オプション）
  SENDGRID_API_KEY: z.string().optional(),
  CONTACT_EMAIL_TO: z.string().email().optional(),
  CONTACT_EMAIL_FROM: z.string().email().optional(),

  // HubSpot設定（オプション）
  NEXT_PUBLIC_HUBSPOT_PORTAL_ID: z.string().optional(),
  NEXT_PUBLIC_HUBSPOT_FORM_ID: z.string().optional(),
})

/**
 * 環境変数の型定義
 */
export type Env = z.infer<typeof envSchema>

/**
 * 環境変数のバリデーションと取得
 */
function validateEnv(): Env {
  // 開発環境でのデバッグ情報
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    console.log('🔍 環境変数の検証を開始します...')
  }

  // テスト環境またはCI環境ではモック値を返す
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST ||
    process.env.CI === 'true'
  ) {
    return {
      NODE_ENV: 'test',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'test-app-id',
      FIREBASE_ADMIN_PROJECT_ID: 'test-project',
      FIREBASE_ADMIN_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
      FIREBASE_ADMIN_PRIVATE_KEY:
        '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      MICROCMS_SERVICE_DOMAIN: 'test-service',
      MICROCMS_API_KEY: 'test-api-key',
      STRIPE_SECRET_KEY: 'sk_test_12345',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_12345',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      NEXT_PUBLIC_HUBSPOT_PORTAL_ID: 'test-portal-id',
      NEXT_PUBLIC_HUBSPOT_FORM_ID: 'test-form-id',
    }
  }

  // クライアントサイドでは検証を行わず、公開されている環境変数のみを返す
  if (typeof window !== 'undefined') {
    return {
      NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'dummy-app-id',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy',
      // サーバーサイドの環境変数はダミー値を設定
      FIREBASE_ADMIN_PROJECT_ID: '',
      FIREBASE_ADMIN_CLIENT_EMAIL: 'dummy@example.com',
      FIREBASE_ADMIN_PRIVATE_KEY: '',
      MICROCMS_SERVICE_DOMAIN: '',
      MICROCMS_API_KEY: '',
      STRIPE_SECRET_KEY: '',
      STRIPE_WEBHOOK_SECRET: '',
      NEXTAUTH_URL: '',
      NEXTAUTH_SECRET: '',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      NEXT_PUBLIC_HUBSPOT_PORTAL_ID: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
      NEXT_PUBLIC_HUBSPOT_FORM_ID: process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID,
    } as Env
  }

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    // Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    // microCMS
    MICROCMS_SERVICE_DOMAIN: process.env.MICROCMS_SERVICE_DOMAIN,
    MICROCMS_API_KEY: process.env.MICROCMS_API_KEY,
    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // NextAuth
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // HubSpot
    NEXT_PUBLIC_HUBSPOT_PORTAL_ID: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    NEXT_PUBLIC_HUBSPOT_FORM_ID: process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID,
    // Email
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    CONTACT_EMAIL_TO: process.env.CONTACT_EMAIL_TO,
    CONTACT_EMAIL_FROM: process.env.CONTACT_EMAIL_FROM,
  })

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors
    )
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

/**
 * 環境変数のインスタンス
 * アプリケーション全体で使用する
 */
export const env = validateEnv()

/**
 * 環境判定のヘルパー関数
 */
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
