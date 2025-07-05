/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authorize } from './authOptions'
import { adminDb } from '@/lib/firebase/admin'
import { verifyPassword } from '@/lib/auth/password'

// モック
vi.mock('@/lib/firebase/admin')
vi.mock('@/lib/auth/password')

const mockedAdminDb = vi.mocked(adminDb)
const mockedVerifyPassword = vi.mocked(verifyPassword)

describe('authorize function', () => {
  const mockUserDoc = {
    id: 'user123',
    data: () => ({
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password',
      image: null,
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('有効な認証情報でユーザーを認証する', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [mockUserDoc],
    })
    mockedAdminDb.collection = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: mockGet,
    })
    mockedVerifyPassword.mockResolvedValue(true)

    const user = await authorize({
      email: 'test@example.com',
      password: 'password',
    })

    expect(user).toEqual({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    })
  })

  it('認証情報がない場合nullを返す', async () => {
    const user = await authorize(undefined)
    expect(user).toBeNull()
  })

  it('メールアドレスがない場合nullを返す', async () => {
    const user = await authorize({ password: 'password' })
    expect(user).toBeNull()
  })

  it('パスワードがない場合nullを返す', async () => {
    const user = await authorize({ email: 'test@example.com' })
    expect(user).toBeNull()
  })

  it('ユーザーが見つからない場合nullを返す', async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: true })
    mockedAdminDb.collection = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: mockGet,
    })

    const user = await authorize({
      email: 'notfound@example.com',
      password: 'password',
    })

    expect(user).toBeNull()
  })

  it('パスワードが間違っている場合nullを返す', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [mockUserDoc],
    })
    mockedAdminDb.collection = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: mockGet,
    })
    mockedVerifyPassword.mockResolvedValue(false)

    const user = await authorize({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    expect(user).toBeNull()
  })

  it('パスワードハッシュがないユーザーの場合nullを返す', async () => {
    const userDocWithoutPassword = {
      id: 'user123',
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      }),
    }
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [userDocWithoutPassword],
    })
    mockedAdminDb.collection = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: mockGet,
    })

    const user = await authorize({
      email: 'test@example.com',
      password: 'password',
    })

    expect(user).toBeNull()
  })

  it('authorizeでエラーが発生した場合nullを返す', async () => {
    mockedAdminDb.collection = vi.fn().mockImplementation(() => {
      throw new Error('DB Error')
    })

    const user = await authorize({
      email: 'test@example.com',
      password: 'password',
    })

    expect(user).toBeNull()
  })
})

describe('authOptions', () => {
  // authOptionsオブジェクト自体のテスト
  it('正しいページ設定を持つ', async () => {
    // authOptionsモジュールを直接インポート
    const { authOptions } = await import('./authOptions')
    
    expect(authOptions.pages).toEqual({
      signIn: '/login',
      signOut: '/login',
      error: '/login',
      verifyRequest: '/login?verify=1',
    })
  })

  it('JWTセッション戦略を使用する', async () => {
    const { authOptions } = await import('./authOptions')
    
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  describe('callbacks', () => {
    it('sessionコールバックがユーザーIDを設定する', async () => {
      const { authOptions } = await import('./authOptions')
      
      const session = {
        user: { email: 'test@example.com' },
        expires: '2025-01-01T00:00:00.000Z',
      }
      const token = { sub: 'user123' }
      
      const result = await authOptions.callbacks?.session?.({ session, token })
      
      expect(result?.user?.id).toBe('user123')
    })

    it('sessionコールバックがユーザーなしでも動作する', async () => {
      const { authOptions } = await import('./authOptions')
      
      const session = { expires: '2025-01-01T00:00:00.000Z' }
      const token = { sub: 'user123' }
      
      const result = await authOptions.callbacks?.session?.({ session, token })
      
      expect(result).toEqual(session)
    })

    it('jwtコールバックがユーザーIDを設定する', async () => {
      const { authOptions } = await import('./authOptions')
      
      const user = { id: 'user123' }
      const token = {}
      
      const result = await authOptions.callbacks?.jwt?.({ user, token })
      
      expect(result?.uid).toBe('user123')
    })

    it('jwtコールバックがユーザーなしでも動作する', async () => {
      const { authOptions } = await import('./authOptions')
      
      const token = { existingData: 'test' }
      
      const result = await authOptions.callbacks?.jwt?.({ token })
      
      expect(result).toEqual(token)
    })
  })
})