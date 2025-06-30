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

    vi.mocked(getApps).mockReturnValueOnce([{ name: 'existing-app' }] as ReturnType<typeof getApps>)

    const { adminDb } = await import('./admin')

    expect(adminDb).toBeDefined()
  })

  it('should throw error when environment variables are missing', async () => {
    delete process.env.FIREBASE_ADMIN_PROJECT_ID

    await expect(() => import('./admin')).rejects.toThrow(
      'Firebase Admin environment variables are not configured'
    )
  })
})