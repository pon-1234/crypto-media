/**
 * 共通エラーハンドリング関数
 */

/**
 * エラーをコンソールに出力する
 * 将来的にSentryなどの外部ロギングサービスへの送信もここで行う
 *
 * @param error - 補足されたエラーオブジェクト
 * @param contextMessage - エラーが発生したコンテキストを示すメッセージ
 */
export function handleError(error: unknown, contextMessage: string): void {
  // エラーオブジェクトからメッセージを抽出
  const errorMessage = error instanceof Error ? error.message : String(error)

  console.error(`[Error] ${contextMessage}:`, errorMessage)

  // ここでSentry.captureException(error)などを呼び出す
}
