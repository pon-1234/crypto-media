/**
 * @vitest-environment node
 * @issue https://github.com/pon-1234/crypto-media/issues/38
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '../route'
import { getServerSession, Session } from 'next-auth'
import { adminDb } from '@/lib/firebase/admin'
import { stripe } from '@/lib/stripe/client'

// モックの設定
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth/authOptions', () => ({
  authOptions: {},
}))

// Firebase Admin SDK のモックヘルパー
const createMockBatch = () => {
  const mockCommit = vi.fn().mockResolvedValue([])
  const mockDelete = vi.fn()
  const mockUpdate = vi.fn()
  
  return {
    delete: mockDelete,
    update: mockUpdate,
    commit: mockCommit,
    create: vi.fn(),
    set: vi.fn(),
  }
}

const createMockDocumentReference = () => ({
  id: 'mock-doc-id',
  path: 'mock-path',
})

const createMockQuerySnapshot = (docs: Array<{ ref: unknown }>) => ({
  forEach: vi.fn((callback: (doc: { ref: unknown }) => void) => {
    docs.forEach(callback)
  }),
  docs: docs,
  size: docs.length,
  empty: docs.length === 0,
})

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    batch: vi.fn(() => createMockBatch()),
    collection: vi.fn((collectionName: string) => {
      if (collectionName === 'audit_logs') {
        return {
          add: vi.fn().mockResolvedValue({}),
        }
      }
      return {
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({
            exists: true,
            data: () => ({ stripeSubscriptionId: 'sub_test123' }),
            ref: createMockDocumentReference(),
            id: 'mock-doc-id',
          })),
        })),
        where: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(
            createMockQuerySnapshot([{ ref: createMockDocumentReference() }])
          )),
        })),
      }
    }),
  },
}))

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    subscriptions: {
      cancel: vi.fn(),
    },
  },
}))

vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
    remaining: 2,
    reset: Date.now() / 1000 + 3600,
  }),
}))

describe('DELETE /api/account/delete', () => {
  const mockSession: Session = {
    user: { id: 'user123', email: 'test@example.com' },
    expires: '2025-01-01T00:00:00.000Z',
  }
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('認証されていない場合は401を返す', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/account/delete', {
      method: 'DELETE',
      body: JSON.stringify({ userId: 'user123', confirmEmail: 'test@example.com' }),
    })
    const response = await DELETE(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.message).toBe('認証が必要です')
  })

  it('成功時は200を返す', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

    const request = new NextRequest('http://localhost:3000/api/account/delete', {
      method: 'DELETE',
      body: JSON.stringify({ userId: 'user123', confirmEmail: 'test@example.com' }),
    })
    const response = await DELETE(request)

    // エラーの詳細を確認
    if (response.status !== 200) {
      const errorData = await response.json()
      console.error('Response error:', errorData)
    }

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toBe('アカウントを削除しました')
  })

  it('Stripeサブスクリプションをキャンセルする', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

    const request = new NextRequest('http://localhost:3000/api/account/delete', {
      method: 'DELETE',
      body: JSON.stringify({ userId: 'user123', confirmEmail: 'test@example.com' }),
    })
    await DELETE(request)

    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test123', {
      prorate: false,
    })
  })

  it('エラー時は500を返す', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

    // バッチ処理でエラーを発生させる
    const mockBatch = createMockBatch()
    mockBatch.commit.mockRejectedValueOnce(new Error('Database error'))
    vi.mocked(adminDb.batch).mockReturnValueOnce(mockBatch)

    const request = new NextRequest('http://localhost:3000/api/account/delete', {
      method: 'DELETE',
      body: JSON.stringify({ userId: 'user123', confirmEmail: 'test@example.com' }),
    })
    const response = await DELETE(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.message).toBe('アカウントの削除に失敗しました')
  })

  it('メールアドレスが一致しない場合は400を返す', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

    const request = new NextRequest('http://localhost:3000/api/account/delete', {
      method: 'DELETE',
      body: JSON.stringify({ userId: 'user123', confirmEmail: 'wrong@example.com' }),
    })
    const response = await DELETE(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.message).toBe('メールアドレスが一致しません')
  })
})