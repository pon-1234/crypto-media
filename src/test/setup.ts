/**
 * Vitest Setup File
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { vi } from 'vitest'
import '@testing-library/jest-dom'

// CI環境変数を設定
// NODE_ENVは読み取り専用のため、既に設定されていることを前提とする
if (process.env.CI === 'true' && process.env.NODE_ENV !== 'test') {
  console.warn('NODE_ENV should be set to "test" in CI environment')
}

// グローバルなfetch APIをモック
global.fetch = vi.fn()

// window.location.originを設定
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
})

// NEXTAUTH_URLを設定
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Firebase環境変数のモック（テスト環境用）
process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'
process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com'
process.env.FIREBASE_ADMIN_PRIVATE_KEY = 'test-key'

// microCMS環境変数のモック（テスト環境用）
process.env.MICROCMS_SERVICE_DOMAIN = 'dummy-domain'
process.env.MICROCMS_API_KEY = 'dummy-key'

// Firebase adminのモック
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn().mockReturnValue({}),
  getApps: vi.fn().mockReturnValue([]),
  cert: vi.fn((config) => config),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
    runTransaction: vi.fn(),
  }),
}))

// authOptionsのモック
vi.mock('@/lib/auth/authOptions', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
    pages: {},
    adapter: {},
  },
}))
