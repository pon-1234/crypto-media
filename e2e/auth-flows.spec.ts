import { test, expect } from '@playwright/test'

/**
 * 認証フローのE2Eテスト
 *
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */

// テスト用のユーザー情報
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!@#',
  weakPassword: 'weak123',
}

test.describe('認証フロー', () => {
  test.describe('新規登録', () => {
    test('メール/パスワードで新規登録できる', async ({ page }) => {
      // 新規登録ページへ移動
      await page.goto('/signup')

      // フォームが表示されることを確認
      await expect(
        page.getByRole('heading', { name: 'アカウントを作成' })
      ).toBeVisible()

      // メールアドレスを入力
      await page.getByLabel('メールアドレス').fill(testUser.email)

      // 弱いパスワードを入力して、バリデーションエラーを確認
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.weakPassword)
      await expect(
        page.getByText('大文字を1文字以上含めてください')
      ).toBeVisible()
      await expect(
        page.getByText('特殊文字を1文字以上含めてください')
      ).toBeVisible()

      // 強いパスワードを入力
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await expect(
        page.getByText('✓ パスワードは要件を満たしています')
      ).toBeVisible()

      // パスワード確認を入力（不一致の場合）
      await page
        .getByLabel('パスワード（確認）')
        .fill('DifferentPassword123!@#')
      await expect(page.getByText('パスワードが一致しません')).toBeVisible()

      // 正しいパスワード確認を入力
      await page.getByLabel('パスワード（確認）').fill(testUser.password)

      // 利用規約に同意
      await page.getByLabel('利用規約に同意します').check()

      // 登録ボタンをクリック
      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // 登録完了後、ログインページにリダイレクトされることを確認
      await page.waitForURL('/login')
      await expect(page.getByText('アカウントが作成されました')).toBeVisible()
    })

    test('既存のメールアドレスでは登録できない', async ({ page }) => {
      // まず1回目の登録
      await page.goto('/signup')
      const uniqueEmail = `duplicate-test-${Date.now()}@example.com`

      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await page.getByLabel('パスワード（確認）').fill(testUser.password)
      await page.getByLabel('利用規約に同意します').check()
      await page.getByRole('button', { name: 'アカウントを作成' }).click()
      await page.waitForURL('/login')

      // 同じメールアドレスで再度登録を試みる
      await page.goto('/signup')
      await page.getByLabel('メールアドレス').fill(uniqueEmail)
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await page.getByLabel('パスワード（確認）').fill(testUser.password)
      await page.getByLabel('利用規約に同意します').check()
      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // エラーメッセージが表示されることを確認
      await expect(
        page.getByText('このメールアドレスは既に使用されています')
      ).toBeVisible()
    })
  })

  test.describe('ログイン', () => {
    // テスト用ユーザーを作成
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup')
      const loginTestEmail = `login-test-${Date.now()}@example.com`

      await page.getByLabel('メールアドレス').fill(loginTestEmail)
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await page.getByLabel('パスワード（確認）').fill(testUser.password)
      await page.getByLabel('利用規約に同意します').check()
      await page.getByRole('button', { name: 'アカウントを作成' }).click()
      await page.waitForURL('/login')

      // テストデータを保存
      testUser.email = loginTestEmail
    })

    test('メール/パスワードでログインできる', async ({ page }) => {
      await page.goto('/login')

      // フォームが表示されることを確認
      await expect(
        page.getByRole('heading', { name: 'ログイン' })
      ).toBeVisible()

      // メールアドレスとパスワードを入力
      await page.getByLabel('メールアドレス').fill(testUser.email)
      await page.getByLabel('パスワード').fill(testUser.password)

      // ログインボタンをクリック
      await page
        .getByRole('button', { name: 'メールアドレスでログイン' })
        .click()

      // ホームページにリダイレクトされることを確認
      await page.waitForURL('/')

      // ログイン後のUIを確認（例：マイページリンクが表示される）
      await expect(page.getByRole('link', { name: 'マイページ' })).toBeVisible()
    })

    test('間違ったパスワードではログインできない', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel('メールアドレス').fill(testUser.email)
      await page.getByLabel('パスワード').fill('WrongPassword123!@#')

      await page
        .getByRole('button', { name: 'メールアドレスでログイン' })
        .click()

      // エラーメッセージが表示されることを確認
      await expect(
        page.getByText('メールアドレスまたはパスワードが正しくありません')
      ).toBeVisible()
    })

    test('存在しないメールアドレスではログインできない', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel('メールアドレス').fill('nonexistent@example.com')
      await page.getByLabel('パスワード').fill(testUser.password)

      await page
        .getByRole('button', { name: 'メールアドレスでログイン' })
        .click()

      // エラーメッセージが表示されることを確認
      await expect(
        page.getByText('メールアドレスまたはパスワードが正しくありません')
      ).toBeVisible()
    })
  })

  test.describe('パスワードリセット', () => {
    let resetTestEmail: string

    // テスト用ユーザーを作成
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup')
      resetTestEmail = `reset-test-${Date.now()}@example.com`

      await page.getByLabel('メールアドレス').fill(resetTestEmail)
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await page.getByLabel('パスワード（確認）').fill(testUser.password)
      await page.getByLabel('利用規約に同意します').check()
      await page.getByRole('button', { name: 'アカウントを作成' }).click()
      await page.waitForURL('/login')
    })

    test('パスワードリセットメールを要求できる', async ({ page }) => {
      // ログインページからパスワードリセットリンクをクリック
      await page.goto('/login')
      await page
        .getByRole('link', { name: 'パスワードをお忘れですか？' })
        .click()

      // パスワードリセットページに遷移
      await expect(page).toHaveURL('/reset-password')
      await expect(
        page.getByRole('heading', { name: 'パスワードをリセット' })
      ).toBeVisible()

      // メールアドレスを入力
      await page.getByLabel('メールアドレス').fill(resetTestEmail)

      // リセットメール送信ボタンをクリック
      await page.getByRole('button', { name: 'リセットメールを送信' }).click()

      // 成功メッセージが表示されることを確認
      await expect(
        page.getByText(
          'パスワードリセットのメールを送信しました。メールをご確認ください。'
        )
      ).toBeVisible()
    })

    test('存在しないメールアドレスでも成功メッセージを表示（セキュリティ対策）', async ({
      page,
    }) => {
      await page.goto('/reset-password')

      // 存在しないメールアドレスを入力
      await page
        .getByLabel('メールアドレス')
        .fill('nonexistent-user@example.com')

      // リセットメール送信ボタンをクリック
      await page.getByRole('button', { name: 'リセットメールを送信' }).click()

      // 成功メッセージが表示されることを確認（セキュリティのため）
      await expect(
        page.getByText(
          'パスワードリセットのメールを送信しました。メールをご確認ください。'
        )
      ).toBeVisible()
    })

    test('リセットトークンを使用して新しいパスワードを設定できる（開発環境のみ）', async ({
      page,
      context,
    }) => {
      // 開発環境でのみ動作するテスト
      if (process.env.NODE_ENV !== 'development') {
        test.skip()
      }

      // パスワードリセットをリクエスト
      await page.goto('/reset-password')
      await page.getByLabel('メールアドレス').fill(resetTestEmail)
      await page.getByRole('button', { name: 'リセットメールを送信' }).click()

      // 開発環境では、レスポンスからリセットURLを取得できる
      // 実際のメール送信の代わりに、APIレスポンスを監視
      const resetUrlResponse = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/forgot-password') &&
          response.status() === 200
      )
      const responseData = await resetUrlResponse.json()

      if (responseData.resetUrl) {
        // 新しいタブでリセットURLを開く
        const resetPage = await context.newPage()
        await resetPage.goto(responseData.resetUrl)

        // 新しいパスワード設定フォームが表示されることを確認
        await expect(
          resetPage.getByRole('heading', { name: '新しいパスワードを設定' })
        ).toBeVisible()

        // 新しいパスワードを入力
        const newPassword = 'NewTestPassword456!@#'
        await resetPage.getByLabel('新しいパスワード').fill(newPassword)
        await resetPage.getByLabel('パスワード（確認）').fill(newPassword)

        // パスワード要件を満たしていることを確認
        await expect(
          resetPage.getByText('✓ パスワードは要件を満たしています')
        ).toBeVisible()

        // パスワードを更新
        await resetPage
          .getByRole('button', { name: 'パスワードを更新' })
          .click()

        // 成功メッセージが表示されることを確認
        await expect(
          resetPage.getByText(
            'パスワードが正常にリセットされました。ログインページに移動します...'
          )
        ).toBeVisible()

        // ログインページにリダイレクトされることを確認
        await resetPage.waitForURL('/login', { timeout: 5000 })

        // 新しいパスワードでログインできることを確認
        await resetPage.getByLabel('メールアドレス').fill(resetTestEmail)
        await resetPage.getByLabel('パスワード').fill(newPassword)
        await resetPage
          .getByRole('button', { name: 'メールアドレスでログイン' })
          .click()

        // ホームページにリダイレクトされることを確認
        await resetPage.waitForURL('/')

        await resetPage.close()
      }
    })
  })

  test.describe('認証状態の保持', () => {
    test('ログイン後、ページをリロードしてもログイン状態が保持される', async ({
      page,
    }) => {
      // ユーザーを作成してログイン
      await page.goto('/signup')
      const sessionTestEmail = `session-test-${Date.now()}@example.com`

      await page.getByLabel('メールアドレス').fill(sessionTestEmail)
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await page.getByLabel('パスワード（確認）').fill(testUser.password)
      await page.getByLabel('利用規約に同意します').check()
      await page.getByRole('button', { name: 'アカウントを作成' }).click()
      await page.waitForURL('/login')

      // ログイン
      await page.getByLabel('メールアドレス').fill(sessionTestEmail)
      await page.getByLabel('パスワード').fill(testUser.password)
      await page
        .getByRole('button', { name: 'メールアドレスでログイン' })
        .click()
      await page.waitForURL('/')

      // ページをリロード
      await page.reload()

      // まだログイン状態であることを確認
      await expect(page.getByRole('link', { name: 'マイページ' })).toBeVisible()
    })

    test('ログアウト後、認証が必要なページにアクセスするとログインページにリダイレクトされる', async ({
      page,
    }) => {
      // ユーザーを作成してログイン
      await page.goto('/signup')
      const logoutTestEmail = `logout-test-${Date.now()}@example.com`

      await page.getByLabel('メールアドレス').fill(logoutTestEmail)
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await page.getByLabel('パスワード（確認）').fill(testUser.password)
      await page.getByLabel('利用規約に同意します').check()
      await page.getByRole('button', { name: 'アカウントを作成' }).click()
      await page.waitForURL('/login')

      // ログイン
      await page.getByLabel('メールアドレス').fill(logoutTestEmail)
      await page.getByLabel('パスワード').fill(testUser.password)
      await page
        .getByRole('button', { name: 'メールアドレスでログイン' })
        .click()
      await page.waitForURL('/')

      // マイページにアクセスできることを確認
      await page.goto('/media/mypage')
      await expect(page).toHaveURL('/media/mypage')

      // ログアウト
      await page.getByRole('button', { name: 'ログアウト' }).click()

      // マイページにアクセスしようとするとログインページにリダイレクトされることを確認
      await page.goto('/media/mypage')
      await expect(page).toHaveURL('/login?from=/media/mypage')
    })
  })

  test.describe('フォームバリデーション', () => {
    test('メールアドレスの形式チェック', async ({ page }) => {
      await page.goto('/signup')

      // 無効なメールアドレスを入力
      await page.getByLabel('メールアドレス').fill('invalid-email')
      await page
        .getByLabel('パスワード', { exact: true })
        .fill(testUser.password)
      await page.getByLabel('パスワード（確認）').fill(testUser.password)
      await page.getByLabel('利用規約に同意します').check()

      // フォーム送信を試みる
      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // ブラウザのバリデーションメッセージが表示されることを確認
      const emailInput = page.getByLabel('メールアドレス')
      const validationMessage = await emailInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      )
      expect(validationMessage).toBeTruthy()
    })

    test('必須フィールドの確認', async ({ page }) => {
      await page.goto('/signup')

      // 何も入力せずに送信を試みる
      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // メールアドレスフィールドにフォーカスが当たることを確認
      const emailInput = page.getByLabel('メールアドレス')
      await expect(emailInput).toBeFocused()
    })
  })
})
