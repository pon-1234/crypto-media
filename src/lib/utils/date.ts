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
  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(date)
}

/**
 * ISO 8601形式の日付文字列を日時形式に変換する
 * @param dateString - ISO 8601形式の日付文字列
 * @returns フォーマットされた日時文字列 (例: 2025年1月1日 12:00)
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(date)
}
