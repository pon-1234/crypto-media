import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateResetToken,
  saveResetToken,
  verifyResetToken,
  markTokenAsUsed,
  cleanupExpiredTokens,
} from './reset-token'
import { adminDb } from '@/lib/firebase/admin'
import { WriteBatch } from 'firebase-admin/firestore'

/**
 * パスワードリセットトークンのテスト
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
      })),
      where: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
    batch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn(),
    })),
  },
}))

describe('reset-token utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateResetToken', () => {
    it('セキュアなランダムトークンを生成する', () => {
      const token1 = generateResetToken()
      const token2 = generateResetToken()

      expect(token1).toHaveLength(64) // 32バイト = 64文字の16進数
      expect(token1).toMatch(/^[a-f0-9]{64}$/)
      expect(token1).not.toBe(token2) // トークンは一意であるべき
    })
  })

  describe('saveResetToken', () => {
    it('デフォルトの有効期限でトークンを保存する', async () => {
      const mockSet = vi.fn()
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          set: mockSet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      const email = 'test@example.com'
      const token = 'test-token'

      await saveResetToken(email, token)

      expect(mockSet).toHaveBeenCalledWith({
        email,
        token,
        expiresAt: expect.any(Date),
        used: false,
        createdAt: expect.any(Date),
      })

      // 有効期限が約1時間後であることを確認
      const savedData = mockSet.mock.calls[0][0]
      const diffMs =
        savedData.expiresAt.getTime() - savedData.createdAt.getTime()
      expect(diffMs).toBeGreaterThan(59 * 60 * 1000)
      expect(diffMs).toBeLessThan(61 * 60 * 1000)
    })

    it('カスタムの有効期限でトークンを保存する', async () => {
      const mockSet = vi.fn()
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          set: mockSet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      const email = 'test@example.com'
      const token = 'test-token'
      const customExpiry = 30 * 60 * 1000 // 30分

      await saveResetToken(email, token, customExpiry)

      const savedData = mockSet.mock.calls[0][0]
      const diffMs =
        savedData.expiresAt.getTime() - savedData.createdAt.getTime()
      expect(diffMs).toBeGreaterThan(29 * 60 * 1000)
      expect(diffMs).toBeLessThan(31 * 60 * 1000)
    })
  })

  describe('verifyResetToken', () => {
    it('有効なトークンのメールアドレスを返す', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'test@example.com',
          used: false,
          expiresAt: {
            toDate: () => new Date(Date.now() + 30 * 60 * 1000), // 30分後
          },
        }),
      })

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          get: mockGet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      const result = await verifyResetToken('valid-token')
      expect(result).toBe('test@example.com')
    })

    it('存在しないトークンの場合はnullを返す', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      })

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          get: mockGet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      const result = await verifyResetToken('invalid-token')
      expect(result).toBeNull()
    })

    it('使用済みトークンの場合はnullを返す', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'test@example.com',
          used: true,
          expiresAt: {
            toDate: () => new Date(Date.now() + 30 * 60 * 1000),
          },
        }),
      })

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          get: mockGet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      const result = await verifyResetToken('used-token')
      expect(result).toBeNull()
    })

    it('期限切れトークンの場合はnullを返す', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'test@example.com',
          used: false,
          expiresAt: {
            toDate: () => new Date(Date.now() - 1000), // 1秒前に期限切れ
          },
        }),
      })

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          get: mockGet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      const result = await verifyResetToken('expired-token')
      expect(result).toBeNull()
    })

    it('エラーが発生した場合はnullを返す', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Database error'))

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          get: mockGet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      const result = await verifyResetToken('error-token')
      expect(result).toBeNull()
    })
  })

  describe('markTokenAsUsed', () => {
    it('トークンを使用済みにする', async () => {
      const mockUpdate = vi.fn()
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn(() => ({
          update: mockUpdate,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      await markTokenAsUsed('test-token')

      expect(mockUpdate).toHaveBeenCalledWith({
        used: true,
        usedAt: expect.any(Date),
      })
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('期限切れトークンを削除する', async () => {
      const mockDocs = [{ ref: { id: 'token1' } }, { ref: { id: 'token2' } }]
      const mockGet = vi.fn().mockResolvedValue({
        docs: mockDocs,
        size: 2,
      })
      const mockDelete = vi.fn()
      const mockCommit = vi.fn()

      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn(() => ({
          get: mockGet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      vi.mocked(adminDb.batch).mockReturnValue({
        delete: mockDelete,
        commit: mockCommit,
      } as unknown as WriteBatch)

      const count = await cleanupExpiredTokens()

      expect(count).toBe(2)
      expect(mockDelete).toHaveBeenCalledTimes(2)
      expect(mockCommit).toHaveBeenCalled()
    })

    it('期限切れトークンがない場合は0を返す', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        docs: [],
        size: 0,
      })
      const mockCommit = vi.fn()

      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn(() => ({
          get: mockGet,
        })),
      } as unknown as ReturnType<typeof adminDb.collection>)

      vi.mocked(adminDb.batch).mockReturnValue({
        delete: vi.fn(),
        commit: mockCommit,
      } as unknown as WriteBatch)

      const count = await cleanupExpiredTokens()

      expect(count).toBe(0)
      expect(mockCommit).toHaveBeenCalled()
    })
  })
})
