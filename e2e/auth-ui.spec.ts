import { test, expect } from '@playwright/test'

/**
 * 認証UIのE2Eテスト（外部API非依存）
 * 
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

test.describe('認証UI', () => {
  test.describe('ログインページ', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('ページが正しく表示される', async ({ page }) => {
      // タイトル
      await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
      
      // Google SSOボタン
      await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible()
      
      // メール/パスワードフォーム
      await expect(page.getByLabel('メールアドレス')).toBeVisible()
      await expect(page.getByLabel('パスワード')).toBeVisible()
      await expect(page.getByRole('button', { name: 'メールアドレスでログイン' })).toBeVisible()
      
      // リンク
      await expect(page.getByRole('link', { name: 'パスワードをお忘れですか？' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'アカウントをお持ちでない方はこちら' })).toBeVisible()
    })

    test('フォームバリデーションが機能する', async ({ page }) => {
      const loginButton = page.getByRole('button', { name: 'メールアドレスでログイン' })
      
      // 空のフォームで送信
      await loginButton.click()
      
      // メールアドレスフィールドにフォーカスが当たる
      await expect(page.getByLabel('メールアドレス')).toBeFocused()
      
      // 無効なメールアドレスを入力
      await page.getByLabel('メールアドレス').fill('invalid-email')
      await page.getByLabel('パスワード').fill('password123')
      
      // HTML5バリデーションによりフォームが送信されない
      const emailInput = page.getByLabel('メールアドレス')
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
      expect(validationMessage).toBeTruthy()
    })

    test('パスワードフィールドがマスクされている', async ({ page }) => {
      const passwordInput = page.getByLabel('パスワード')
      const inputType = await passwordInput.getAttribute('type')
      expect(inputType).toBe('password')
    })
  })

  test.describe('新規登録ページ', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup')
    })

    test('ページが正しく表示される', async ({ page }) => {
      // タイトル
      await expect(page.getByRole('heading', { name: 'アカウントを作成' })).toBeVisible()
      
      // Google SSOボタン
      await expect(page.getByRole('button', { name: 'Googleでサインアップ' })).toBeVisible()
      
      // フォームフィールド
      await expect(page.getByLabel('メールアドレス')).toBeVisible()
      await expect(page.getByLabel('パスワード', { exact: true })).toBeVisible()
      await expect(page.getByLabel('パスワード（確認）')).toBeVisible()
      await expect(page.getByLabel('利用規約に同意します')).toBeVisible()
      await expect(page.getByRole('button', { name: 'アカウントを作成' })).toBeVisible()
      
      // リンク
      await expect(page.getByRole('link', { name: 'すでにアカウントをお持ちの方はこちら' })).toBeVisible()
    })

    test('パスワード強度チェックが機能する', async ({ page }) => {
      const passwordInput = page.getByLabel('パスワード', { exact: true })
      
      // 弱いパスワード
      await passwordInput.fill('weak')
      await expect(page.getByText('パスワードは8文字以上で入力してください')).toBeVisible()
      await expect(page.getByText('大文字を1文字以上含めてください')).toBeVisible()
      await expect(page.getByText('数字を1文字以上含めてください')).toBeVisible()
      await expect(page.getByText('特殊文字を1文字以上含めてください')).toBeVisible()
      
      // 中程度のパスワード
      await passwordInput.fill('Password123')
      await expect(page.getByText('特殊文字を1文字以上含めてください')).toBeVisible()
      
      // 強いパスワード
      await passwordInput.fill('Password123!@#')
      await expect(page.getByText('✓ パスワードは要件を満たしています')).toBeVisible()
    })

    test('パスワード確認チェックが機能する', async ({ page }) => {
      await page.getByLabel('パスワード', { exact: true }).fill('Password123!@#')
      await page.getByLabel('パスワード（確認）').fill('Different123!@#')
      
      await expect(page.getByText('パスワードが一致しません')).toBeVisible()
    })

    test('利用規約への同意が必須', async ({ page }) => {
      // フォームを入力
      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.getByLabel('パスワード', { exact: true }).fill('Password123!@#')
      await page.getByLabel('パスワード（確認）').fill('Password123!@#')
      
      // 利用規約に同意せずに送信
      const submitButton = page.getByRole('button', { name: 'アカウントを作成' })
      await submitButton.click()
      
      // チェックボックスにフォーカスが当たる
      const checkbox = page.getByLabel('利用規約に同意します')
      const validationMessage = await checkbox.evaluate((el: HTMLInputElement) => el.validationMessage)
      expect(validationMessage).toBeTruthy()
    })
  })

  test.describe('パスワードリセットページ', () => {
    test('メール送信フォームが表示される（トークンなし）', async ({ page }) => {
      await page.goto('/reset-password')
      
      await expect(page.getByRole('heading', { name: 'パスワードをリセット' })).toBeVisible()
      await expect(page.getByText('登録したメールアドレスを入力してください')).toBeVisible()
      await expect(page.getByLabel('メールアドレス')).toBeVisible()
      await expect(page.getByRole('button', { name: 'リセットメールを送信' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'ログインページに戻る' })).toBeVisible()
    })

    test('パスワード設定フォームが表示される（トークンあり）', async ({ page }) => {
      await page.goto('/reset-password?token=test-token-123')
      
      await expect(page.getByRole('heading', { name: '新しいパスワードを設定' })).toBeVisible()
      await expect(page.getByText('新しいパスワードを入力してください')).toBeVisible()
      await expect(page.getByLabel('新しいパスワード')).toBeVisible()
      await expect(page.getByLabel('パスワード（確認）')).toBeVisible()
      await expect(page.getByRole('button', { name: 'パスワードを更新' })).toBeVisible()
      
      // パスワード要件の表示
      await expect(page.getByText('パスワードの要件：')).toBeVisible()
      await expect(page.getByText('8文字以上')).toBeVisible()
      await expect(page.getByText('大文字・小文字を含む')).toBeVisible()
      await expect(page.getByText('数字を含む')).toBeVisible()
      await expect(page.getByText('特殊文字（!@#$%^&*など）を含む')).toBeVisible()
    })
  })

  test.describe('ナビゲーション', () => {
    test('ログインと新規登録ページ間を移動できる', async ({ page }) => {
      // ログインページから開始
      await page.goto('/login')
      
      // 新規登録ページへ
      await page.getByRole('link', { name: 'アカウントをお持ちでない方はこちら' }).click()
      await expect(page).toHaveURL('/signup')
      
      // ログインページへ戻る
      await page.getByRole('link', { name: 'すでにアカウントをお持ちの方はこちら' }).click()
      await expect(page).toHaveURL('/login')
    })

    test('パスワードリセットページへ移動できる', async ({ page }) => {
      await page.goto('/login')
      
      await page.getByRole('link', { name: 'パスワードをお忘れですか？' }).click()
      await expect(page).toHaveURL('/reset-password')
      
      // ログインページへ戻る
      await page.getByRole('link', { name: 'ログインページに戻る' }).click()
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('レスポンシブデザイン', () => {
    test('モバイルビューで正しく表示される', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/login')
      
      // すべての要素が表示される
      await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible()
      await expect(page.getByLabel('メールアドレス')).toBeVisible()
      await expect(page.getByLabel('パスワード')).toBeVisible()
      
      // ボタンが適切な幅を持つ
      const googleButton = page.getByRole('button', { name: 'Googleでログイン' })
      const box = await googleButton.boundingBox()
      expect(box?.width).toBeGreaterThan(300)
    })

    test('タブレットビューで正しく表示される', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/signup')
      
      // すべての要素が表示される
      await expect(page.getByRole('heading', { name: 'アカウントを作成' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Googleでサインアップ' })).toBeVisible()
      await expect(page.getByLabel('メールアドレス')).toBeVisible()
      await expect(page.getByLabel('パスワード', { exact: true })).toBeVisible()
    })
  })

  test.describe('アクセシビリティ', () => {
    test('キーボードナビゲーションが機能する', async ({ page }) => {
      await page.goto('/login')
      
      // Tabキーで移動
      await page.keyboard.press('Tab') // Skip to main (if exists)
      await page.keyboard.press('Tab') // Google button
      await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeFocused()
      
      await page.keyboard.press('Tab') // Email
      await expect(page.getByLabel('メールアドレス')).toBeFocused()
      
      await page.keyboard.press('Tab') // Password
      await expect(page.getByLabel('パスワード')).toBeFocused()
      
      await page.keyboard.press('Tab') // Login button
      await expect(page.getByRole('button', { name: 'メールアドレスでログイン' })).toBeFocused()
    })

    test('フォームラベルが正しく関連付けられている', async ({ page }) => {
      await page.goto('/signup')
      
      // ラベルをクリックすると入力フィールドにフォーカス
      await page.getByText('メールアドレス', { exact: true }).click()
      await expect(page.getByLabel('メールアドレス')).toBeFocused()
      
      await page.getByText('パスワード', { exact: true }).first().click()
      await expect(page.getByLabel('パスワード', { exact: true })).toBeFocused()
    })
  })
})