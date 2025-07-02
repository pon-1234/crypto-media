import { NextRequest } from 'next/server'
import { POST } from './route'
import { adminDb } from '@/lib/firebase/admin'
import { generateResetToken, saveResetToken } from '@/lib/auth/reset-token'
import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * パスワードリセット要求APIのテスト
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
  },
}))

vi.mock('@/lib/auth/reset-token', () => ({
  generateResetToken: vi.fn(),
  saveResetToken: vi.fn(),
}))

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('正常なリクエストでリセットトークンが生成される', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({ email: 'test@example.com', passwordHash: 'hashed' }),
      }],
    })

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    } as unknown as ReturnType<typeof adminDb.collection>)

    vi.mocked(generateResetToken).mockReturnValue('test-reset-token')
    vi.mocked(saveResetToken).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）')
    expect(generateResetToken).toHaveBeenCalled()
    expect(saveResetToken).toHaveBeenCalledWith('test@example.com', 'test-reset-token')
  })

  it('開発環境ではリセットURLを返す', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({ email: 'test@example.com', passwordHash: 'hashed' }),
      }],
    })

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    } as unknown as ReturnType<typeof adminDb.collection>)

    vi.mocked(generateResetToken).mockReturnValue('test-reset-token')

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.resetUrl).toBe('http://localhost:3000/reset-password?token=test-reset-token')

    process.env.NODE_ENV = originalEnv
  })

  it('無効なメールアドレスの場合、400エラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('有効なメールアドレスを入力してください')
  })

  it('存在しないユーザーでも成功レスポンスを返す（セキュリティ対策）', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      empty: true,
    })

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    } as unknown as ReturnType<typeof adminDb.collection>)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）')
    expect(generateResetToken).not.toHaveBeenCalled()
    expect(saveResetToken).not.toHaveBeenCalled()
  })

  it('パスワードハッシュがないユーザーでも成功レスポンスを返す', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({ email: 'google-user@example.com' }), // passwordHashがない
      }],
    })

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    } as unknown as ReturnType<typeof adminDb.collection>)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'google-user@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）')
    expect(generateResetToken).not.toHaveBeenCalled()
    expect(saveResetToken).not.toHaveBeenCalled()
  })

  it('Firestoreエラーの場合、500エラーを返す', async () => {
    const mockGet = vi.fn().mockRejectedValue(new Error('Firestore error'))

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    } as unknown as ReturnType<typeof adminDb.collection>)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('パスワードリセット処理中にエラーが発生しました')
  })
})