/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateProfile, changePassword, deleteAccount } from '../account'
import { getServerSession } from 'next-auth'
import { adminDb } from '@/lib/firebase/admin'
import bcrypt from 'bcryptjs'

// モック
vi.mock('next-auth')
vi.mock('@/lib/firebase/admin')
vi.mock('bcryptjs')
vi.mock('stripe')
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    deleteUser: vi.fn(),
  })),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockGetServerSession = vi.mocked(getServerSession)
const mockAdminDb = vi.mocked(adminDb)
const mockBcrypt = vi.mocked(bcrypt)

describe('account actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateProfile', () => {
    it('認証されていない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await updateProfile('user-id', { name: 'New Name' })

      expect(result).toEqual({ error: '認証エラー' })
    })

    it('別のユーザーのプロフィールは更新できない', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'different-user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const result = await updateProfile('user-id', { name: 'New Name' })

      expect(result).toEqual({ error: '認証エラー' })
    })

    it('プロフィールを正常に更新する', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const mockUpdate = vi.fn()
      mockAdminDb.collection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      })

      const result = await updateProfile('user-id', { name: 'New Name' })

      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'New Name',
        updatedAt: expect.any(Date),
      })
      expect(result).toEqual({ success: true })
    })
  })

  describe('changePassword', () => {
    it('認証されていない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await changePassword('user-id', {
        currentPassword: 'old',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      })

      expect(result).toEqual({ error: '認証エラー' })
    })

    it('パスワードが短すぎる場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const result = await changePassword('user-id', {
        currentPassword: 'old',
        newPassword: 'short',
        confirmPassword: 'short',
      })

      expect(result).toEqual({
        error: 'パスワードは8文字以上で入力してください',
      })
    })

    it('パスワードに英数字が含まれていない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const result = await changePassword('user-id', {
        currentPassword: 'old',
        newPassword: 'onlyletters',
        confirmPassword: 'onlyletters',
      })

      expect(result).toEqual({
        error: 'パスワードは英数字を含む必要があります',
      })
    })

    it('パスワードが一致しない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const result = await changePassword('user-id', {
        currentPassword: 'old',
        newPassword: 'newpassword123',
        confirmPassword: 'different123',
      })

      expect(result).toEqual({ error: 'パスワードが一致しません' })
    })

    it('現在のパスワードが正しくない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const mockGet = vi.fn().mockResolvedValue({
        data: () => ({ passwordHash: 'hashed_password' }),
      })
      mockAdminDb.collection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      })

      mockBcrypt.compare.mockResolvedValue(false as never)

      const result = await changePassword('user-id', {
        currentPassword: 'wrong',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      })

      expect(result).toEqual({ error: '現在のパスワードが正しくありません' })
    })

    it('パスワードを正常に変更する', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const mockUpdate = vi.fn()
      const mockGet = vi.fn().mockResolvedValue({
        data: () => ({ passwordHash: 'old_hash' }),
      })
      mockAdminDb.collection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockGet,
          update: mockUpdate,
        }),
      })

      mockBcrypt.compare.mockResolvedValue(true as never)
      mockBcrypt.hash.mockResolvedValue('new_hash' as never)

      const result = await changePassword('user-id', {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        passwordHash: 'new_hash',
        updatedAt: expect.any(Date),
      })
      expect(result).toEqual({ success: true })
    })
  })

  describe('deleteAccount', () => {
    it('認証されていない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await deleteAccount('user-id', {
        password: 'password',
        hasPaidMembership: false,
      })

      expect(result).toEqual({ error: '認証エラー' })
    })

    it('ユーザーが存在しない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const mockGet = vi.fn().mockResolvedValue({
        data: () => null,
      })
      mockAdminDb.collection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      })

      const result = await deleteAccount('user-id', {
        password: 'password',
        hasPaidMembership: false,
      })

      expect(result).toEqual({ error: 'ユーザー情報が見つかりません' })
    })

    it('パスワードが正しくない場合はエラーを返す', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const mockGet = vi.fn().mockResolvedValue({
        data: () => ({ passwordHash: 'hashed_password' }),
      })
      mockAdminDb.collection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockGet }),
      })

      mockBcrypt.compare.mockResolvedValue(false as never)

      const result = await deleteAccount('user-id', {
        password: 'wrong',
        hasPaidMembership: false,
      })

      expect(result).toEqual({ error: 'パスワードが正しくありません' })
    })

    it('アカウントを正常に削除する', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-id' },
        expires: '2025-01-01T00:00:00.000Z',
      })

      const mockDelete = vi.fn()
      const mockGet = vi.fn().mockResolvedValue({
        data: () => ({ passwordHash: 'hashed_password' }),
      })
      const mockAdd = vi.fn()

      mockAdminDb.collection = vi.fn().mockImplementation((collection) => {
        if (collection === 'deletion_reasons') {
          return { add: mockAdd }
        }
        return {
          doc: vi.fn().mockReturnValue({
            get: mockGet,
            delete: mockDelete,
          }),
        }
      })

      mockBcrypt.compare.mockResolvedValue(true as never)

      const result = await deleteAccount('user-id', {
        password: 'password',
        reason: '退会理由',
        hasPaidMembership: false,
      })

      expect(mockDelete).toHaveBeenCalledTimes(2) // users と members
      expect(mockAdd).toHaveBeenCalledWith({
        userId: 'user-id',
        reason: '退会理由',
        deletedAt: expect.any(Date),
        hadPaidMembership: false,
      })
      expect(result).toEqual({ success: true })
    })
  })
})
