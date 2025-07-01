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

// Mock environment detection
vi.mock('@/lib/env/detect', () => ({
  isTestOrCI: vi.fn(() => false),
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
    // 環境変数を削除
    delete process.env.FIREBASE_ADMIN_PROJECT_ID
    delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY

    // モジュールのキャッシュをクリア
    vi.resetModules()

    await expect(() => import('./admin')).rejects.toThrow(
      'Firebase Admin environment variables are not configured'
    )
  })

  it('should return mock instance in test/CI environment', async () => {
    // isTestOrCIがtrueを返すようにモック
    const { isTestOrCI } = await import('@/lib/env/detect')
    vi.mocked(isTestOrCI).mockReturnValue(true)

    vi.resetModules()
    const { adminDb } = await import('./admin')

    // モックインスタンスが返されることを確認
    expect(adminDb).toBeDefined()
    expect(adminDb.collection).toBeDefined()
    
    // collectionを呼び出してモックのメソッドが動作することを確認
    const collection = adminDb.collection('test')
    expect(collection.doc).toBeDefined()
  })
})
