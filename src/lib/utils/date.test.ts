import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from './date'

/**
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

describe('date utils', () => {
  describe('formatDate', () => {
    it('ISO 8601形式の日付を日本語形式に変換する', () => {
      const result = formatDate('2025-01-01T00:00:00.000Z')
      expect(result).toBe('2025年1月1日')
    })

    it('異なる時刻でも日本時間で正しく日付を表示する', () => {
      // UTCの日付がJSTでどう表示されるかを確認
      // 2025-06-15T00:00:00.000Z = 2025-06-15 09:00 JST
      const result1 = formatDate('2025-06-15T00:00:00.000Z')
      // 2025-06-15T23:59:59.999Z = 2025-06-16 08:59:59.999 JST
      const result2 = formatDate('2025-06-15T23:59:59.999Z')
      expect(result1).toBe('2025年6月15日')
      expect(result2).toBe('2025年6月16日')
    })

    it('無効な日付文字列の場合は空文字を返す', () => {
      expect(formatDate('invalid-date')).toBe('')
      expect(formatDate('')).toBe('')
    })

    it('月と日が一桁の場合も正しくフォーマットする', () => {
      const result = formatDate('2025-03-05T00:00:00.000Z')
      expect(result).toBe('2025年3月5日')
    })
  })

  describe('formatDateTime', () => {
    it('ISO 8601形式の日時を日本語形式に変換する', () => {
      // date-fnsはローカルタイムゾーンで動作するため、テスト環境依存
      const date = new Date('2025-01-01T12:30:00.000Z')
      const expectedHour = date.getHours()
      const expectedMinute = date.getMinutes()
      const result = formatDateTime('2025-01-01T12:30:00.000Z')
      expect(result).toBe(`2025年1月1日 ${String(expectedHour).padStart(2, '0')}:${String(expectedMinute).padStart(2, '0')}`)
    })

    it('午前0時の場合も正しく表示する', () => {
      const date = new Date('2025-01-01T00:00:00.000Z')
      const expectedHour = date.getHours()
      const expectedMinute = date.getMinutes()
      const result = formatDateTime('2025-01-01T00:00:00.000Z')
      expect(result).toBe(`2025年1月1日 ${String(expectedHour).padStart(2, '0')}:${String(expectedMinute).padStart(2, '0')}`)
    })

    it('無効な日時文字列の場合は空文字を返す', () => {
      expect(formatDateTime('invalid-datetime')).toBe('')
      expect(formatDateTime('')).toBe('')
    })

    it('秒は表示されない', () => {
      const date = new Date('2025-01-01T12:30:45.000Z')
      const expectedHour = date.getHours()
      const expectedMinute = date.getMinutes()
      const result = formatDateTime('2025-01-01T12:30:45.000Z')
      expect(result).toBe(`2025年1月1日 ${String(expectedHour).padStart(2, '0')}:${String(expectedMinute).padStart(2, '0')}`) // 秒は省略される
    })
  })
})
