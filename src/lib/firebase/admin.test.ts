import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getApps } from 'firebase-admin/app'

// Mock firebase-admin
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn().mockReturnValue({}),
  getApps: vi.fn().mockReturnValue([]),
  cert: vi.fn((config) => config),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn(),
    doc: vi.fn(),
  }),
}))

describe('Firebase Admin', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should initialize Firebase Admin with correct configuration', async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@example.com'
    process.env.FIREBASE_ADMIN_PRIVATE_KEY = 'test-key\\nwith\\nnewlines'

    const { adminDb } = await import('./admin')

    expect(adminDb).toBeDefined()
    expect(adminDb.collection).toBeDefined()
  })

  it('should reuse existing app if already initialized', async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@example.com'
    process.env.FIREBASE_ADMIN_PRIVATE_KEY = 'test-key'

    vi.mocked(getApps).mockReturnValueOnce([
      { name: 'existing-app' },
    ] as ReturnType<typeof getApps>)

    const { adminDb } = await import('./admin')

    expect(adminDb).toBeDefined()
  })

  it('should throw error when environment variables are missing', async () => {
    // 環境変数をバックアップ
    const originalCI = process.env.CI
    const originalProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    
    // CI環境を無効化して環境変数を削除
    process.env.CI = 'false'
    delete process.env.FIREBASE_ADMIN_PROJECT_ID
    
    // モジュールのキャッシュをクリア
    vi.resetModules()

    try {
      await expect(() => import('./admin')).rejects.toThrow(
        'Firebase Admin environment variables are not configured'
      )
    } finally {
      // 環境変数を復元
      process.env.CI = originalCI
      if (originalProjectId) {
        process.env.FIREBASE_ADMIN_PROJECT_ID = originalProjectId
      }
    }
  })
})
