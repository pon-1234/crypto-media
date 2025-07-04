/**
 * パスワードリセット要求APIのテスト
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { adminDb } from '@/lib/firebase/admin'
import { generateResetToken, saveResetToken } from '@/lib/auth/reset-token'
import { sendEmail } from '@/lib/email/sendgrid'

// モック
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}))

vi.mock('@/lib/auth/reset-token', () => ({
  generateResetToken: vi.fn(),
  saveResetToken: vi.fn(),
}))

vi.mock('@/lib/email/sendgrid', () => ({
  sendEmail: vi.fn(),
}))

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('有効なメールアドレスでパスワードリセットメールを送信する', async () => {
    const mockEmail = 'test@example.com'
    const mockToken = 'reset-token-123'
    const mockUserData = {
      email: mockEmail,
      passwordHash: 'hashed-password',
    }

    // モックの設定
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockUserData }],
    })
    const mockWhere = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockReturnThis()
    const mockCollection = vi.fn().mockReturnValue({
      where: mockWhere,
      limit: mockLimit,
      get: mockGet,
    })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection)
    vi.mocked(generateResetToken).mockReturnValue(mockToken)
    vi.mocked(saveResetToken).mockResolvedValue()
    vi.mocked(sendEmail).mockResolvedValue()

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: mockEmail }),
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe(
      'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）'
    )
    expect(mockCollection).toHaveBeenCalledWith('users')
    expect(mockWhere).toHaveBeenCalledWith('email', '==', mockEmail)
    expect(mockLimit).toHaveBeenCalledWith(1)
    expect(generateResetToken).toHaveBeenCalled()
    expect(saveResetToken).toHaveBeenCalledWith(mockEmail, mockToken)
    expect(sendEmail).toHaveBeenCalledWith({
      to: mockEmail,
      subject: 'パスワードリセットのご案内',
      text: expect.stringContaining(mockToken),
      html: expect.stringContaining(mockToken),
    })
  })

  it('無効なメールアドレスでエラーを返す', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email' }),
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('有効なメールアドレスを入力してください')
    expect(adminDb.collection).not.toHaveBeenCalled()
  })

  it('存在しないユーザーでも成功レスポンスを返す（セキュリティのため）', async () => {
    const mockEmail = 'nonexistent@example.com'

    // モックの設定
    const mockGet = vi.fn().mockResolvedValue({
      empty: true,
      docs: [],
    })
    const mockWhere = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockReturnThis()
    const mockCollection = vi.fn().mockReturnValue({
      where: mockWhere,
      limit: mockLimit,
      get: mockGet,
    })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection)

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: mockEmail }),
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe(
      'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）'
    )
    expect(generateResetToken).not.toHaveBeenCalled()
    expect(saveResetToken).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('パスワードハッシュがないユーザー（Googleログインのみ）でも成功レスポンスを返す', async () => {
    const mockEmail = 'google-only@example.com'
    const mockUserData = {
      email: mockEmail,
      // passwordHashがない
    }

    // モックの設定
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockUserData }],
    })
    const mockWhere = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockReturnThis()
    const mockCollection = vi.fn().mockReturnValue({
      where: mockWhere,
      limit: mockLimit,
      get: mockGet,
    })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection)

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: mockEmail }),
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe(
      'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）'
    )
    expect(generateResetToken).not.toHaveBeenCalled()
    expect(saveResetToken).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('開発環境ではリセットURLも返す', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    const mockEmail = 'test@example.com'
    const mockToken = 'reset-token-123'
    const mockUserData = {
      email: mockEmail,
      passwordHash: 'hashed-password',
    }

    // モックの設定
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockUserData }],
    })
    const mockWhere = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockReturnThis()
    const mockCollection = vi.fn().mockReturnValue({
      where: mockWhere,
      limit: mockLimit,
      get: mockGet,
    })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection)
    vi.mocked(generateResetToken).mockReturnValue(mockToken)
    vi.mocked(saveResetToken).mockResolvedValue()
    vi.mocked(sendEmail).mockResolvedValue()

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: mockEmail }),
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.resetUrl).toBe(
      `http://localhost:3000/reset-password?token=${mockToken}`
    )

    vi.unstubAllEnvs()
  })

  it('サーバーエラーが発生した場合、500エラーを返す', async () => {
    const mockEmail = 'test@example.com'

    // モックの設定
    const mockCollection = vi.fn().mockImplementation(() => {
      throw new Error('Database error')
    })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection)

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: mockEmail }),
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('パスワードリセット処理中にエラーが発生しました')
  })
})
