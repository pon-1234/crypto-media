import { test, expect } from '@playwright/test'

test.describe('アカウント管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('メールアドレス').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('パスワード').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: 'ログイン' }).click()
    await expect(page.getByRole('heading', { name: 'メディア' })).toBeVisible()
  })

  test('アカウント設定ページへの遷移', async ({ page }) => {
    await page.goto('/media/mypage')
    await page.getByRole('link', { name: 'アカウント設定' }).click()
    await expect(page).toHaveURL(/.*settings/)
    await expect(
      page.getByRole('heading', { name: 'アカウント設定' })
    ).toBeVisible()
  })

  test('プロフィールの更新ができる', async ({ page }) => {
    await page.goto('/media/mypage/settings')

    const newName = `Test User ${Date.now()}`
    await page.getByLabel('名前').fill(newName)
    await page.getByRole('button', { name: 'プロフィールを更新' }).click()

    await expect(page.getByText('プロフィールを更新しました')).toBeVisible()
    
    // ページがリフレッシュされ、新しい名前が表示されていることを確認
    await page.reload()
    await expect(page.getByLabel('名前')).toHaveValue(newName)
  })

  test('パスワードの変更ができる', async ({ page }) => {
    await page.goto('/media/mypage/settings')

    const currentPassword = process.env.TEST_USER_PASSWORD!
    const newPassword = `new-password-${Date.now()}`

    await page.getByLabel('現在のパスワード').fill(currentPassword)
    await page.getByLabel('新しいパスワード', { exact: true }).fill(newPassword)
    await page.getByLabel('新しいパスワード（確認）').fill(newPassword)
    await page.getByRole('button', { name: 'パスワードを変更' }).click()

    await expect(page.getByText('パスワードを変更しました')).toBeVisible()

    // TODO: 新しいパスワードで再ログインできることを確認するテストを追加
  })

  test('現在のパスワードが間違っている場合、エラーが表示される', async ({ page }) => {
    await page.goto('/media/mypage/settings')

    await page.getByLabel('現在のパスワード').fill('wrong-password')
    await page.getByLabel('新しいパスワード', { exact: true }).fill('new-password')
    await page.getByLabel('新しいパスワード（確認）').fill('new-password')
    await page.getByRole('button', { name: '変更する' }).click()

    await expect(page.getByText('現在のパスワードが違います')).toBeVisible()
  })

  test('アカウントの削除ができる', async ({ page }) => {
    await page.goto('/media/mypage/delete-account')

    await expect(
      page.getByRole('heading', { name: '退会手続き' })
    ).toBeVisible()

    // 確認事項を入力
    await page
      .getByLabel('確認のため、登録メールアドレスを入力してください')
      .fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('「削除する」と入力してください').fill('削除する')

    // 削除ボタンをクリック
    await page.getByRole('button', { name: 'アカウントを削除する' }).click()

    // トップページにリダイレクトされることを確認
    await expect(page).toHaveURL('/')
    await expect(
      page.getByText('アカウントを削除しました')
    ).toBeVisible()
  })
}) 