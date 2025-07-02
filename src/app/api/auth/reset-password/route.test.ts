import { NextRequest } from 'next/server'
import { POST } from './route'
import { adminDb } from '@/lib/firebase/admin'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { verifyResetToken, markTokenAsUsed } from '@/lib/auth/reset-token'
import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * パスワードリセット実行APIのテスト
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

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(),
  validatePasswordStrength: vi.fn(),
}))

vi.mock('@/lib/auth/reset-token', () => ({
  verifyResetToken: vi.fn(),
  markTokenAsUsed: vi.fn(),
}))

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正常なリクエストでパスワードが更新される', async () => {
    const mockUpdate = vi.fn()
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{
        ref: { update: mockUpdate },
      }],
    })

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    } as unknown as ReturnType<typeof adminDb.collection>)

    vi.mocked(validatePasswordStrength).mockReturnValue({ isValid: true, errors: [] })
    vi.mocked(verifyResetToken).mockResolvedValue('test@example.com')
    vi.mocked(hashPassword).mockResolvedValue('new-hashed-password')
    vi.mocked(markTokenAsUsed).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'valid-reset-token',
        password: 'NewTest123!@#',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('パスワードが正常に更新されました')
    expect(verifyResetToken).toHaveBeenCalledWith('valid-reset-token')
    expect(hashPassword).toHaveBeenCalledWith('NewTest123!@#')
    expect(mockUpdate).toHaveBeenCalledWith({
      passwordHash: 'new-hashed-password',
      updatedAt: expect.any(Date),
    })
    expect(markTokenAsUsed).toHaveBeenCalledWith('valid-reset-token')
  })

  it('トークンが無効な場合、400エラーを返す', async () => {
    vi.mocked(validatePasswordStrength).mockReturnValue({ isValid: true, errors: [] })
    vi.mocked(verifyResetToken).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'NewTest123!@#',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('リセットトークンが無効または期限切れです')
    expect(markTokenAsUsed).not.toHaveBeenCalled()
  })

  it('パスワードが弱い場合、400エラーを返す', async () => {
    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: false,
      errors: ['大文字を1文字以上含めてください', '特殊文字を1文字以上含めてください'],
    })

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'weakpassword123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('大文字を1文字以上含めてください, 特殊文字を1文字以上含めてください')
    expect(verifyResetToken).not.toHaveBeenCalled()
  })

  it('ユーザーが見つからない場合、404エラーを返す', async () => {
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

    vi.mocked(validatePasswordStrength).mockReturnValue({ isValid: true, errors: [] })
    vi.mocked(verifyResetToken).mockResolvedValue('nonexistent@example.com')

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewTest123!@#',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('ユーザーが見つかりません')
    expect(markTokenAsUsed).not.toHaveBeenCalled()
  })

  it('トークンが空の場合、400エラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: '',
        password: 'NewTest123!@#',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('トークンが必要です')
  })

  it('パスワードが短すぎる場合、400エラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'short',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('パスワードは8文字以上で入力してください')
  })

  it('Firestoreエラーの場合、500エラーを返す', async () => {
    vi.mocked(validatePasswordStrength).mockReturnValue({ isValid: true, errors: [] })
    vi.mocked(verifyResetToken).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewTest123!@#',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('パスワードリセット中にエラーが発生しました')
  })
})