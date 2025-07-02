import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from './password'

/**
 * パスワードユーティリティのテスト
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */
describe('password utilities', () => {
  describe('hashPassword', () => {
    it('プレーンテキストパスワードをハッシュ化する', async () => {
      const password = 'Test123!@#'
      const hashed = await hashPassword(password)

      expect(hashed).not.toBe(password)
      expect(hashed.length).toBeGreaterThan(0)
      expect(hashed).toMatch(/^\$2[ayb]\$.{56}$/) // bcrypt形式
    })

    it('同じパスワードでも異なるハッシュを生成する', async () => {
      const password = 'Test123!@#'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('正しいパスワードを検証できる', async () => {
      const password = 'Test123!@#'
      const hashed = await hashPassword(password)

      const result = await verifyPassword(password, hashed)
      expect(result).toBe(true)
    })

    it('間違ったパスワードを拒否する', async () => {
      const password = 'Test123!@#'
      const wrongPassword = 'Wrong123!@#'
      const hashed = await hashPassword(password)

      const result = await verifyPassword(wrongPassword, hashed)
      expect(result).toBe(false)
    })

    it('空のパスワードを拒否する', async () => {
      const password = 'Test123!@#'
      const hashed = await hashPassword(password)

      const result = await verifyPassword('', hashed)
      expect(result).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('強いパスワードを有効と判定する', () => {
      const result = validatePasswordStrength('Test123!@#')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('短すぎるパスワードを拒否する', () => {
      const result = validatePasswordStrength('Te1!A')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('パスワードは8文字以上で入力してください')
    })

    it('大文字がないパスワードを拒否する', () => {
      const result = validatePasswordStrength('test123!@#')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('大文字を1文字以上含めてください')
    })

    it('小文字がないパスワードを拒否する', () => {
      const result = validatePasswordStrength('TEST123!@#')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('小文字を1文字以上含めてください')
    })

    it('数字がないパスワードを拒否する', () => {
      const result = validatePasswordStrength('TestTest!@#')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('数字を1文字以上含めてください')
    })

    it('特殊文字がないパスワードを拒否する', () => {
      const result = validatePasswordStrength('TestTest123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('特殊文字を1文字以上含めてください')
    })

    it('複数のエラーを同時に検出する', () => {
      const result = validatePasswordStrength('test')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(4) // 長さ、大文字、数字、特殊文字
    })

    it('様々な特殊文字を受け入れる', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>'
      for (const char of specialChars) {
        const result = validatePasswordStrength(`Test123${char}`)
        expect(result.isValid).toBe(true)
      }
    })
  })
})
