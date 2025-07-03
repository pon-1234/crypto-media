import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test('新規登録フローが正しく動作する', async ({ page }) => {
    await page.goto('/register')
    
    // 新規登録フォームが表示されることを確認
    await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible()
    
    // メールアドレスとパスワードを入力
    const testEmail = `test${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    await page.getByLabel('メールアドレス').fill(testEmail)
    await page.getByLabel('パスワード', { exact: true }).fill(testPassword)
    await page.getByLabel('パスワード（確認）').fill(testPassword)
    
    // 利用規約に同意
    await page.getByLabel('利用規約に同意する').check()
    
    // 登録ボタンをクリック
    await page.getByRole('button', { name: '登録する' }).click()
    
    // 登録完了後、メディアページにリダイレクトされることを確認
    await expect(page).toHaveURL('/media')
    await expect(page.getByRole('heading', { name: 'メディア' })).toBeVisible()
  })

  test('ログインフローが正しく動作する', async ({ page }) => {
    await page.goto('/login')
    
    // ログインフォームが表示されることを確認
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
    
    // テストユーザーでログイン
    await page.getByLabel('メールアドレス').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('パスワード').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: 'ログイン' }).click()
    
    // ログイン後、メディアページにリダイレクトされることを確認
    await expect(page).toHaveURL('/media')
    await expect(page.getByRole('heading', { name: 'メディア' })).toBeVisible()
  })

  test('Googleでログインできる', async ({ page }) => {
    await page.goto('/login')
    
    // Googleログインボタンが存在することを確認
    const googleButton = page.getByRole('button', { name: 'Googleでログイン' })
    await expect(googleButton).toBeVisible()
    
    // ボタンをクリックするとGoogleの認証ページに遷移することを確認
    // 実際のGoogle認証はE2Eテストでは困難なため、ボタンの存在確認のみ
  })

  test('ログインエラーが正しく表示される', async ({ page }) => {
    await page.goto('/login')
    
    // 間違った認証情報でログイン試行
    await page.getByLabel('メールアドレス').fill('wrong@example.com')
    await page.getByLabel('パスワード').fill('wrongpassword')
    await page.getByRole('button', { name: 'ログイン' }).click()
    
    // エラーメッセージが表示されることを確認
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible()
  })

  test('パスワードリセットリンクが機能する', async ({ page }) => {
    await page.goto('/login')
    
    // パスワードを忘れた場合のリンクをクリック
    await page.getByRole('link', { name: 'パスワードを忘れた方' }).click()
    
    // パスワードリセットページに遷移することを確認
    await expect(page).toHaveURL('/reset-password')
    await expect(page.getByRole('heading', { name: 'パスワードリセット' })).toBeVisible()
  })

  test('ログアウトが正しく動作する', async ({ page }) => {
    // まずログイン
    await page.goto('/login')
    await page.getByLabel('メールアドレス').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('パスワード').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: 'ログイン' }).click()
    await expect(page).toHaveURL('/media')
    
    // マイページへ移動
    await page.goto('/media/mypage')
    
    // ログアウトボタンをクリック
    await page.getByRole('button', { name: 'ログアウト' }).click()
    
    // トップページにリダイレクトされることを確認
    await expect(page).toHaveURL('/')
    
    // ログイン状態が解除されていることを確認（ログインリンクが表示される）
    await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible()
  })

  test('認証が必要なページへのアクセス制限', async ({ page }) => {
    // ログインせずにマイページにアクセス
    await page.goto('/media/mypage')
    
    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
  })

  test('セッションタイムアウト後の再ログイン', async ({ page }) => {
    // ログイン
    await page.goto('/login')
    await page.getByLabel('メールアドレス').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('パスワード').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: 'ログイン' }).click()
    await expect(page).toHaveURL('/media')
    
    // セッションCookieを削除してセッションタイムアウトをシミュレート
    await page.context().clearCookies()
    
    // 認証が必要なページにアクセス
    await page.goto('/media/mypage')
    
    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/login')
  })
})