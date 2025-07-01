/**
 * env.ts のモック環境での単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect } from 'vitest'
import { env, isDevelopment, isProduction, isTest } from '../env'

describe('env in test environment', () => {
  it('テスト環境でモック値が返される', () => {
    expect(env.NODE_ENV).toBe('test')
    expect(env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-api-key')
    expect(env.MICROCMS_SERVICE_DOMAIN).toBe('test-service')
    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_12345')
    expect(env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID).toBe('test-portal-id')
    expect(env.NEXT_PUBLIC_HUBSPOT_FORM_ID).toBe('test-form-id')
  })

  it('環境判定ヘルパー関数がテスト環境で正しく動作する', () => {
    expect(isDevelopment).toBe(false)
    expect(isProduction).toBe(false)
    expect(isTest).toBe(true)
  })
})
