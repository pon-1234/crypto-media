import { test as setup } from '@playwright/test'

/**
 * 認証テスト用のセットアップ
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

setup.describe.configure({ mode: 'serial' })

// テスト環境のセットアップ
setup('prepare test environment', async () => {
  // テスト用の環境変数が設定されているか確認
  if (!process.env.CI) {
    console.log('Running E2E tests in local environment')
  }
  
  // テストデータのクリーンアップなどが必要な場合はここに追加
})