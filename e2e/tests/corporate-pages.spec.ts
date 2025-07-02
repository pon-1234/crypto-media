import { test, expect } from '@playwright/test'

/**
 * コーポレートページのE2Eテスト
 * @issue https://github.com/pon-1234/crypto-media/issues/25
 */
test.describe('Corporate Pages CMS Integration', () => {
  test.describe('About Page', () => {
    test('should display about page content from CMS', async ({ page }) => {
      await page.goto('/about')
      
      // ページタイトルが表示されていることを確認
      await expect(page.locator('h1')).toContainText('会社概要')
      
      // コンテンツエリアが存在することを確認
      await expect(page.locator('main .max-w-4xl')).toBeVisible()
      
      // メタデータが正しく設定されていることを確認
      await expect(page).toHaveTitle(/会社概要/)
    })

    test('should have proper SEO metadata', async ({ page }) => {
      await page.goto('/about')
      
      // OGPタグの確認
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
      expect(ogTitle).toContain('会社概要')
      
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description).toBeTruthy()
    })
  })

  test.describe('Service Page', () => {
    test('should display service page content from CMS', async ({ page }) => {
      await page.goto('/service')
      
      // ページタイトルが表示されていることを確認
      await expect(page.locator('h1')).toContainText('事業内容')
      
      // コンテンツエリアが存在することを確認
      await expect(page.locator('main .max-w-4xl')).toBeVisible()
      
      // メタデータが正しく設定されていることを確認
      await expect(page).toHaveTitle(/事業内容/)
    })
  })

  test.describe('Privacy Policy Page', () => {
    test('should display privacy policy content from CMS', async ({ page }) => {
      await page.goto('/privacy-policy')
      
      // ページタイトルが表示されていることを確認
      await expect(page.locator('h1')).toContainText('プライバシーポリシー')
      
      // コンテンツエリアが存在することを確認
      await expect(page.locator('main .container')).toBeVisible()
      
      // メタデータが正しく設定されていることを確認
      await expect(page).toHaveTitle(/プライバシーポリシー/)
    })
  })

  test.describe('Terms Page', () => {
    test('should display terms content from CMS', async ({ page }) => {
      await page.goto('/terms')
      
      // ページタイトルが表示されていることを確認
      await expect(page.locator('h1')).toContainText('利用規約')
      
      // コンテンツエリアが存在することを確認
      await expect(page.locator('main .container')).toBeVisible()
      
      // メタデータが正しく設定されていることを確認
      await expect(page).toHaveTitle(/利用規約/)
    })
  })

  test.describe('Navigation', () => {
    test('should navigate between corporate pages', async ({ page }) => {
      // ホームページから開始
      await page.goto('/')
      
      // フッターのリンクを使用してナビゲート
      // 会社概要へ
      await page.click('footer a[href="/about"]')
      await expect(page).toHaveURL('/about')
      await expect(page.locator('h1')).toContainText('会社概要')
      
      // プライバシーポリシーへ
      await page.click('footer a[href="/privacy-policy"]')
      await expect(page).toHaveURL('/privacy-policy')
      await expect(page.locator('h1')).toContainText('プライバシーポリシー')
      
      // 利用規約へ
      await page.click('footer a[href="/terms"]')
      await expect(page).toHaveURL('/terms')
      await expect(page.locator('h1')).toContainText('利用規約')
    })
  })

  test.describe('Error Handling', () => {
    test('should show 404 for non-existent corporate page', async ({ page }) => {
      const response = await page.goto('/non-existent-page')
      
      // 404レスポンスを確認
      expect(response?.status()).toBe(404)
      
      // 404ページのコンテンツを確認
      await expect(page.locator('h1')).toContainText('404')
    })
  })

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      // モバイルビューポートに設定
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/about')
      
      // コンテンツが正しく表示されることを確認
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
      
      // パディングが適用されていることを確認
      const main = page.locator('main')
      await expect(main).toHaveCSS('padding-left', '16px')
      await expect(main).toHaveCSS('padding-right', '16px')
    })
  })
})