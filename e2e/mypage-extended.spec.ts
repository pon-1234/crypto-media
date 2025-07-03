import { test, expect } from '@playwright/test'

/**
 * マイページ拡張機能のE2Eテスト
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @issue #38 - マイページ機能の拡張
 */

test.describe('マイページ拡張機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のログイン処理
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/media/mypage')
  })

  test('プロフィール設定ページにアクセスできる', async ({ page }) => {
    // マイページからプロフィール設定へ遷移
    await page.click('text=プロフィール設定')
    await expect(page).toHaveURL('/media/mypage/settings')
    
    // ページタイトルの確認
    await expect(page.locator('h1')).toHaveText('プロフィール設定')
    
    // 各セクションが表示されていることを確認
    await expect(page.locator('text=アカウント情報')).toBeVisible()
    await expect(page.locator('text=表示名の変更')).toBeVisible()
    await expect(page.locator('text=パスワードの変更')).toBeVisible()
  })

  test('表示名を変更できる', async ({ page }) => {
    await page.goto('/media/mypage/settings')
    
    // 表示名を変更
    const nameInput = page.locator('input[name="name"]')
    await nameInput.clear()
    await nameInput.fill('新しい名前')
    await page.click('button:has-text("更新する")')
    
    // 成功メッセージの確認
    await expect(page.locator('text=プロフィールを更新しました')).toBeVisible()
  })

  test('パスワードを変更できる', async ({ page }) => {
    await page.goto('/media/mypage/settings')
    
    // パスワード変更フォームに入力
    await page.fill('input[id="currentPassword"]', 'testpassword123')
    await page.fill('input[id="newPassword"]', 'newpassword123')
    await page.fill('input[id="confirmPassword"]', 'newpassword123')
    await page.click('button:has-text("パスワードを変更")')
    
    // 成功メッセージの確認
    await expect(page.locator('text=パスワードを変更しました')).toBeVisible()
  })

  test('サポートページにアクセスできる', async ({ page }) => {
    // マイページからサポートへ遷移
    await page.click('text=サポート')
    await expect(page).toHaveURL('/media/mypage/support')
    
    // ページタイトルの確認
    await expect(page.locator('h1')).toHaveText('サポート')
    
    // サポートメニューが表示されていることを確認
    await expect(page.locator('text=よくある質問')).toBeVisible()
    await expect(page.locator('text=用語集')).toBeVisible()
    await expect(page.locator('text=お問い合わせ')).toBeVisible()
    await expect(page.locator('text=利用ガイド')).toBeVisible()
    
    // よくあるトピックが表示されていることを確認
    await expect(page.locator('text=よくあるトピック')).toBeVisible()
  })

  test('退会ページにアクセスできる', async ({ page }) => {
    // マイページの退会リンクをクリック
    await page.click('text=退会をご希望の方はこちら')
    await expect(page).toHaveURL('/media/mypage/delete-account')
    
    // ページタイトルの確認
    await expect(page.locator('h1')).toHaveText('退会手続き')
    
    // 警告メッセージが表示されていることを確認
    await expect(page.locator('text=退会前にご確認ください')).toBeVisible()
    await expect(page.locator('text=削除されたデータは復元できません')).toBeVisible()
  })

  test('退会フォームのバリデーションが機能する', async ({ page }) => {
    await page.goto('/media/mypage/delete-account')
    
    // 何も入力せずに削除ボタンをクリック
    await page.click('button:has-text("アカウントを削除する")')
    
    // エラーメッセージの確認
    await expect(page.locator('text=必要事項を入力してください')).toBeVisible()
    
    // 部分的に入力
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button:has-text("アカウントを削除する")')
    
    // まだエラーが表示される
    await expect(page.locator('text=必要事項を入力してください')).toBeVisible()
    
    // 確認メールアドレスを入力
    await page.fill('input[type="email"]', 'test@example.com')
    
    // 確認テキストを間違えて入力
    await page.fill('input[placeholder="削除する"]', '削除')
    await page.click('button:has-text("アカウントを削除する")')
    
    // エラーメッセージの確認
    await expect(page.locator('text=必要事項を入力してください')).toBeVisible()
  })

  test('有料会員の場合、退会時に追加情報が表示される', async ({ page }) => {
    // 有料会員としてログイン（モック設定が必要）
    // このテストは実際の環境設定に応じて調整が必要
    
    await page.goto('/media/mypage/delete-account')
    
    // 有料会員向けの追加情報を確認
    // 実際のテストでは、テストユーザーの会員ステータスに応じて
    // 表示される内容を確認する
  })
})

test.describe('ナビゲーションの確認', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のログイン処理
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/media/mypage')
  })

  test('各ページから「マイページに戻る」リンクが機能する', async ({ page }) => {
    // プロフィール設定ページ
    await page.goto('/media/mypage/settings')
    await page.click('text=マイページに戻る')
    await expect(page).toHaveURL('/media/mypage')
    
    // サポートページ
    await page.goto('/media/mypage/support')
    await page.click('text=マイページに戻る')
    await expect(page).toHaveURL('/media/mypage')
    
    // 退会ページ
    await page.goto('/media/mypage/delete-account')
    await page.click('text=マイページに戻る')
    await expect(page).toHaveURL('/media/mypage')
  })
})