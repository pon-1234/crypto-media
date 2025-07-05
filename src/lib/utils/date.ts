import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日付フォーマット用ユーティリティ関数
 *
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

/**
 * ISO 8601形式の日付文字列を日本語形式に変換する
 * @param dateString - ISO 8601形式の日付文字列
 * @returns フォーマットされた日付文字列 (例: 2025年1月1日)
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return ''
    }
    // date-fnsはデフォルトでローカルタイムゾーンを使用する
    return format(date, 'yyyy年M月d日', { locale: ja })
  } catch {
    return ''
  }
}

/**
 * ISO 8601形式の日付文字列を日時形式に変換する
 * @param dateString - ISO 8601形式の日付文字列
 * @returns フォーマットされた日時文字列 (例: 2025年1月1日 12:00)
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return ''
    }
    // date-fnsはデフォルトでローカルタイムゾーンを使用する
    return format(date, 'yyyy年M月d日 HH:mm', { locale: ja })
  } catch {
    return ''
  }
}