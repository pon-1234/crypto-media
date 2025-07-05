/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
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
    // AdapterUserも満たす完全なモックユーザー
    const mockAdapterUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: null,
    }

    it('sessionコールバックがユーザーIDを設定する', async () => {
      const { authOptions } = await import('./authOptions')

      const session: Session = {
        user: {
          id: '', // 型定義を満たすため空文字列を設定
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
        expires: '2025-01-01T00:00:00.000Z',
      }
      const token: JWT = { sub: 'user123' }

      const result = await authOptions.callbacks?.session?.({
        session,
        token,
        user: mockAdapterUser,
        newSession: undefined,
        trigger: 'update',
      })

      // テスト環境が型拡張を認識できないため、オプショナルチェーンと型アサーションを使用
      expect(result?.user).toBeDefined()
      if (result?.user && 'id' in result.user) {
        expect(result.user.id).toBe('user123')
      }
    })

    it('sessionコールバックがuserプロパティがなくてもクラッシュしない', async () => {
      const { authOptions } = await import('./authOptions')

      // 型定義上はuserは必須だが、実装がnull-safeかを確認するため、意図的に型をキャスト
      const session = {
        expires: '2025-01-01T00:00:00.000Z',
      } as Session
      const token: JWT = { sub: 'user123' }

      const result = await authOptions.callbacks?.session?.({
        session,
        token,
        user: mockAdapterUser,
        newSession: undefined,
        trigger: 'update',
      })

      // session.user がないため、idは設定されず、もとのsessionが返る
      expect(result).toEqual(session)
      expect(result?.user).toBeUndefined()
    })

    it('jwtコールバックがユーザーIDを設定する', async () => {
      const { authOptions } = await import('./authOptions')

      const token: JWT = {}

      // NextAuthの型定義に合わせる
      const result = await authOptions.callbacks?.jwt?.({
        user: mockAdapterUser,
        token,
        account: null,
        profile: undefined,
        isNewUser: undefined,
        trigger: 'signIn',
      })

      expect(result?.uid).toBe('user123')
    })

    it('jwtコールバックがユーザーなしでも動作する', async () => {
      const { authOptions } = await import('./authOptions')

      const token: JWT = { uid: 'user123', sub: 'user123' }

      // 2回目以降の呼び出し（userがないケース）
      // 型定義とランタイムの挙動が異なるためanyにキャスト
      const result = await authOptions.callbacks?.jwt?.({
        token,
        user: undefined,
        account: null,
        profile: undefined,
        isNewUser: undefined,
        trigger: 'update',
      } as Parameters<NonNullable<typeof authOptions.callbacks>['jwt']>[0])

      expect(result).toEqual(token)
    })
  })
})