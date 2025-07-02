import { NextRequest } from 'next/server'
import { POST } from './route'
import { adminDb } from '@/lib/firebase/admin'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * サインアップAPIのテスト
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

// モック
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
      add: vi.fn(),
    })),
  },
}))

vi.mock('@/lib/auth/password', () => {
  const validatePasswordStrength = vi.fn()
  return {
    hashPassword: vi.fn(),
    validatePasswordStrength,
  }
})

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正常なリクエストでアカウントが作成される', async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: true })
    const mockAdd = vi.fn().mockResolvedValue({ id: 'new-user-id' })

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
      add: mockAdd,
    })

    vi.mocked(hashPassword).mockResolvedValue('hashed-password')
    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      errors: [],
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual({
      id: 'new-user-id',
      email: 'test@example.com',
      name: 'Test User',
    })
    expect(data.message).toBe('アカウントが正常に作成されました')

    // Firestoreへの保存が正しく呼ばれたか確認
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        image: null,
        emailVerified: null,
      })
    )
  })

  it('無効なメールアドレスの場合、400エラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('有効なメールアドレスを入力してください')
  })

  it('パスワードが短すぎる場合、400エラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('パスワードは8文字以上で入力してください')
  })

  it('パスワードが弱い場合、400エラーを返す', async () => {
    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: false,
      errors: [
        '大文字を1文字以上含めてください',
        '特殊文字を1文字以上含めてください',
      ],
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weakpassword123',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe(
      '大文字を1文字以上含めてください, 特殊文字を1文字以上含めてください'
    )
  })

  it('メールアドレスが既に登録されている場合、400エラーを返す', async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: false })

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    })

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      errors: [],
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('このメールアドレスは既に登録されています')
  })

  it('名前が空の場合、400エラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('名前を入力してください')
  })

  it('Firestoreエラーの場合、500エラーを返す', async () => {
    const mockGet = vi.fn().mockRejectedValue(new Error('Firestore error'))

    vi.mocked(adminDb.collection).mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockGet,
        })),
      })),
    })

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      errors: [],
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('アカウント作成中にエラーが発生しました')
  })
})
