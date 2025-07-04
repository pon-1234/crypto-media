import { test, expect } from '@playwright/test'

/**
 * 認証統合テスト（Google SSO + メール/パスワード認証）
 *
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

test.describe('認証方法の統合', () => {
  test('ログインページに両方の認証方法が表示される', async ({ page }) => {
    await page.goto('/login')

    // ページタイトル
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()

    // Google SSOボタン
    await expect(
      page.getByRole('button', { name: 'Googleでログイン' })
    ).toBeVisible()

    // メール/パスワードフォーム
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
    await expect(page.getByLabel('パスワード')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'メールアドレスでログイン' })
    ).toBeVisible()

    // その他のリンク
    await expect(
      page.getByRole('link', { name: 'パスワードをお忘れですか？' })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'アカウントをお持ちでない方はこちら' })
    ).toBeVisible()
  })

  test('新規登録ページに両方の認証方法が表示される', async ({ page }) => {
    await page.goto('/signup')

    // ページタイトル
    await expect(
      page.getByRole('heading', { name: 'アカウントを作成' })
    ).toBeVisible()

    // Google SSOボタン
    await expect(
      page.getByRole('button', { name: 'Googleでサインアップ' })
    ).toBeVisible()

    // メール/パスワードフォーム
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
    await expect(page.getByLabel('パスワード', { exact: true })).toBeVisible()
    await expect(page.getByLabel('パスワード（確認）')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'アカウントを作成' })
    ).toBeVisible()

    // ログインページへのリンク
    await expect(
      page.getByRole('link', { name: 'すでにアカウントをお持ちの方はこちら' })
    ).toBeVisible()
  })

  test('ログインページと新規登録ページ間をナビゲートできる', async ({
    page,
  }) => {
    // ログインページから開始
    await page.goto('/login')

    // 新規登録ページへのリンクをクリック
    await page
      .getByRole('link', { name: 'アカウントをお持ちでない方はこちら' })
      .click()
    await expect(page).toHaveURL('/signup')

    // ログインページへ戻る
    await page
      .getByRole('link', { name: 'すでにアカウントをお持ちの方はこちら' })
      .click()
    await expect(page).toHaveURL('/login')

    // パスワードリセットページへ
    await page.getByRole('link', { name: 'パスワードをお忘れですか？' }).click()
    await expect(page).toHaveURL('/reset-password')

    // ログインページへ戻る
    await page.getByRole('link', { name: 'ログインページに戻る' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('認証エラー時の適切なエラーメッセージ表示', async ({ page }) => {
    await page.goto('/login')

    // 空のフォームで送信
    await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()

    // HTML5バリデーションによりフォームが送信されないことを確認
    const emailInput = page.getByLabel('メールアドレス')
    await expect(emailInput).toBeFocused()

    // 無効なメールアドレス
    await emailInput.fill('invalid-email')
    await page.getByLabel('パスワード').fill('password123')

    // ブラウザのバリデーションメッセージを確認
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test.describe('セキュリティ機能', () => {
    test('パスワード入力フィールドはマスクされている', async ({ page }) => {
      await page.goto('/login')

      const passwordInput = page.getByLabel('パスワード')
      const inputType = await passwordInput.getAttribute('type')
      expect(inputType).toBe('password')
    })

    test('新規登録時のパスワード強度チェック', async ({ page }) => {
      await page.goto('/signup')

      const passwordInput = page.getByLabel('パスワード', { exact: true })

      // 弱いパスワードのテスト
      await passwordInput.fill('123')
      await expect(
        page.getByText('パスワードは8文字以上で入力してください')
      ).toBeVisible()

      // 長さは満たすが、他の要件を満たさない
      await passwordInput.fill('password')
      await expect(
        page.getByText('大文字を1文字以上含めてください')
      ).toBeVisible()
      await expect(
        page.getByText('数字を1文字以上含めてください')
      ).toBeVisible()
      await expect(
        page.getByText('特殊文字を1文字以上含めてください')
      ).toBeVisible()

      // すべての要件を満たす
      await passwordInput.fill('Password123!@#')
      await expect(
        page.getByText('✓ パスワードは要件を満たしています')
      ).toBeVisible()
    })

    test('パスワードリセット時のトークン有効期限', async ({ page }) => {
      // 無効なトークンでアクセス
      await page.goto('/reset-password?token=invalid-token-12345')

      // パスワード設定フォームが表示される
      await expect(
        page.getByRole('heading', { name: '新しいパスワードを設定' })
      ).toBeVisible()

      // 新しいパスワードを入力して送信
      await page.getByLabel('新しいパスワード').fill('NewPassword123!@#')
      await page.getByLabel('パスワード（確認）').fill('NewPassword123!@#')
      await page.getByRole('button', { name: 'パスワードを更新' }).click()

      // エラーメッセージが表示される
      await expect(
        page.getByText('リセットトークンが無効または期限切れです')
      ).toBeVisible()
    })
  })

  test.describe('レスポンシブデザイン', () => {
    test('モバイルビューでの認証フォーム', async ({ page }) => {
      // モバイルビューポートに設定
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/login')

      // すべての要素が表示されることを確認
      await expect(
        page.getByRole('heading', { name: 'ログイン' })
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Googleでログイン' })
      ).toBeVisible()
      await expect(page.getByLabel('メールアドレス')).toBeVisible()
      await expect(page.getByLabel('パスワード')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'メールアドレスでログイン' })
      ).toBeVisible()

      // ボタンが縦に並んでいることを確認（フルwidth）
      const googleButton = page.getByRole('button', {
        name: 'Googleでログイン',
      })
      const emailButton = page.getByRole('button', {
        name: 'メールアドレスでログイン',
      })

      const googleButtonBox = await googleButton.boundingBox()
      const emailButtonBox = await emailButton.boundingBox()

      expect(googleButtonBox?.width).toBeGreaterThan(300)
      expect(emailButtonBox?.width).toBeGreaterThan(300)
    })

    test('タブレットビューでの認証フォーム', async ({ page }) => {
      // タブレットビューポートに設定
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/signup')

      // すべての要素が適切に表示されることを確認
      await expect(
        page.getByRole('heading', { name: 'アカウントを作成' })
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Googleでサインアップ' })
      ).toBeVisible()
      await expect(page.getByLabel('メールアドレス')).toBeVisible()
      await expect(page.getByLabel('パスワード', { exact: true })).toBeVisible()
      await expect(page.getByLabel('パスワード（確認）')).toBeVisible()
    })
  })

  test.describe('アクセシビリティ', () => {
    test('キーボードナビゲーション', async ({ page }) => {
      await page.goto('/login')

      // Tabキーでフォーム要素間を移動
      await page.keyboard.press('Tab') // Skip to main content link (if exists)
      await page.keyboard.press('Tab') // Google login button
      await expect(
        page.getByRole('button', { name: 'Googleでログイン' })
      ).toBeFocused()

      await page.keyboard.press('Tab') // Email input
      await expect(page.getByLabel('メールアドレス')).toBeFocused()

      await page.keyboard.press('Tab') // Password input
      await expect(page.getByLabel('パスワード')).toBeFocused()

      await page.keyboard.press('Tab') // Login button
      await expect(
        page.getByRole('button', { name: 'メールアドレスでログイン' })
      ).toBeFocused()

      await page.keyboard.press('Tab') // Forgot password link
      await expect(
        page.getByRole('link', { name: 'パスワードをお忘れですか？' })
      ).toBeFocused()
    })

    test('フォームラベルの関連付け', async ({ page }) => {
      await page.goto('/signup')

      // ラベルをクリックすると対応する入力フィールドにフォーカスが移る
      await page.getByText('メールアドレス', { exact: true }).click()
      await expect(page.getByLabel('メールアドレス')).toBeFocused()

      await page.getByText('パスワード', { exact: true }).click()
      await expect(page.getByLabel('パスワード', { exact: true })).toBeFocused()

      await page.getByText('パスワード（確認）').click()
      await expect(page.getByLabel('パスワード（確認）')).toBeFocused()
    })
  })
})
