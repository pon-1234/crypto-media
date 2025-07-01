import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isCI,
  isTest,
  isDevelopment,
  isProduction,
  isTestOrCI,
  getEnvironmentInfo,
} from '../detect'

describe('detect', () => {
  const originalEnv = { ...process.env }

  // TypeScriptの型エラーを回避するためのヘルパー
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = process.env as any

  beforeEach(() => {
    // 環境変数をクリア
    Object.keys(process.env).forEach((key) => {
      delete env[key]
    })
    // 元の環境変数を復元
    Object.entries(originalEnv).forEach(([key, value]) => {
      env[key] = value
    })
  })

  afterEach(() => {
    // 環境変数をクリア
    Object.keys(process.env).forEach((key) => {
      delete env[key]
    })
    // 元の環境変数を復元
    Object.entries(originalEnv).forEach(([key, value]) => {
      env[key] = value
    })
  })

  describe('isCI', () => {
    it('CI環境でtrueを返す', () => {
      env.CI = 'true'
      expect(isCI()).toBe(true)
    })

    it('非CI環境でfalseを返す', () => {
      delete env.CI
      expect(isCI()).toBe(false)
    })

    it('CI=falseでfalseを返す', () => {
      env.CI = 'false'
      expect(isCI()).toBe(false)
    })
  })

  describe('isTest', () => {
    it('NODE_ENV=testでtrueを返す', () => {
      env.NODE_ENV = 'test'
      expect(isTest()).toBe(true)
    })

    it('VITEST環境でtrueを返す', () => {
      env.NODE_ENV = 'development'
      env.VITEST = 'true'
      expect(isTest()).toBe(true)
    })

    it('非テスト環境でfalseを返す', () => {
      env.NODE_ENV = 'production'
      delete env.VITEST
      expect(isTest()).toBe(false)
    })
  })

  describe('isDevelopment', () => {
    it('開発環境でtrueを返す', () => {
      env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
    })

    it('非開発環境でfalseを返す', () => {
      env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('isProduction', () => {
    it('本番環境でtrueを返す', () => {
      env.NODE_ENV = 'production'
      expect(isProduction()).toBe(true)
    })

    it('非本番環境でfalseを返す', () => {
      env.NODE_ENV = 'development'
      expect(isProduction()).toBe(false)
    })
  })

  describe('isTestOrCI', () => {
    it('テスト環境でtrueを返す', () => {
      env.NODE_ENV = 'test'
      delete env.CI
      expect(isTestOrCI()).toBe(true)
    })

    it('CI環境でtrueを返す', () => {
      env.NODE_ENV = 'production'
      env.CI = 'true'
      expect(isTestOrCI()).toBe(true)
    })

    it('テストかつCI環境でtrueを返す', () => {
      env.NODE_ENV = 'test'
      env.CI = 'true'
      expect(isTestOrCI()).toBe(true)
    })

    it('非テスト・非CI環境でfalseを返す', () => {
      env.NODE_ENV = 'production'
      delete env.CI
      delete env.VITEST
      expect(isTestOrCI()).toBe(false)
    })
  })

  describe('getEnvironmentInfo', () => {
    it('環境情報を正しく返す', () => {
      env.NODE_ENV = 'development'
      env.CI = 'true'
      env.VITEST = 'true'

      const info = getEnvironmentInfo()

      expect(info.isCI).toBe(true)
      expect(info.isTest).toBe(true)
      expect(info.isDevelopment).toBe(true)
      expect(info.isProduction).toBe(false)
      expect(info.nodeEnv).toBe('development')
      // isServer/isClientはJSDOM環境に依存するため、個別にテストしない
    })

    it('NODE_ENVが未設定の場合、developmentを返す', () => {
      delete env.NODE_ENV

      const info = getEnvironmentInfo()

      expect(info.nodeEnv).toBe('development')
    })
  })
})
