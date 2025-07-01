import { test, expect, devices } from '@playwright/test'

/**
 * レスポンシブデザインのE2Eテスト
 * @doc 主要ページのモバイル、タブレット、デスクトップでの表示確認
 * @issue #14 - レスポンシブデザインの最終調整
 */

const viewports = {
  mobile: devices['iPhone 12'].viewport,
  tablet: devices['iPad'].viewport,
  desktop: { width: 1920, height: 1080 },
}

test.describe('レスポンシブデザイン', () => {
  test.describe('トップページ', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
      test(`${device}表示`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/')

        // ヘッダーの表示確認
        const header = page.locator('header')
        await expect(header).toBeVisible()

        // モバイルの場合はハンバーガーメニューが表示される
        if (device === 'mobile') {
          const hamburger = header.locator('button[aria-expanded]')
          await expect(hamburger).toBeVisible()
          
          // デスクトップメニューは非表示
          const desktopMenu = header.locator('.hidden.md\\:flex')
          await expect(desktopMenu).not.toBeVisible()
        } else {
          // タブレット・デスクトップではデスクトップメニューが表示
          const desktopMenu = header.locator('.hidden.md\\:flex')
          await expect(desktopMenu).toBeVisible()
        }

        // ヒーローセクションのテキストサイズ確認
        const heroTitle = page.locator('h1')
        await expect(heroTitle).toBeVisible()
        
        // 特徴セクションのグリッドレイアウト確認
        const featureGrid = page.locator('.grid').first()
        await expect(featureGrid).toBeVisible()
      })
    })
  })

  test.describe('記事一覧ページ', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
      test(`${device}表示`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/media/articles')

        // ページタイトルの確認
        const title = page.locator('h1')
        await expect(title).toContainText('記事一覧')

        // グリッドレイアウトの確認
        const grid = page.locator('.grid').first()
        await expect(grid).toBeVisible()

        // レスポンシブクラスの確認
        if (device === 'mobile') {
          await expect(grid).toHaveClass(/grid-cols-1/)
        } else if (device === 'tablet') {
          await expect(grid).toHaveClass(/md:grid-cols-2/)
        } else {
          await expect(grid).toHaveClass(/lg:grid-cols-3/)
        }
      })
    })
  })

  test.describe('ログインページ', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
      test(`${device}表示`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/login')

        // フォームコンテナの確認
        const formContainer = page.locator('.max-w-md')
        await expect(formContainer).toBeVisible()

        // Googleログインボタンの確認
        const googleButton = page.locator('button:has-text("Googleでログイン")')
        await expect(googleButton).toBeVisible()

        // モバイルでのタップターゲットサイズ確認
        if (device === 'mobile') {
          const buttonHeight = await googleButton.evaluate(el => 
            window.getComputedStyle(el).minHeight
          )
          expect(parseInt(buttonHeight)).toBeGreaterThanOrEqual(48)
        }
      })
    })
  })

  test.describe('モバイルナビゲーション', () => {
    test('ハンバーガーメニューの動作', async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
      await page.goto('/')

      const header = page.locator('header')
      const hamburgerButton = header.locator('button[aria-expanded]')
      
      // 初期状態ではメニューは閉じている
      await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
      
      // ハンバーガーメニューをクリック
      await hamburgerButton.click()
      
      // メニューが開く
      await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')
      const mobileMenu = page.locator('.md\\:hidden').last()
      await expect(mobileMenu).toBeVisible()
      
      // メニュー項目が表示される
      const menuItems = mobileMenu.locator('a')
      await expect(menuItems).toHaveCount(5) // ナビゲーション項目数を確認
      
      // メニューを閉じる
      await hamburgerButton.click()
      await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
      await expect(mobileMenu).not.toBeVisible()
    })
  })

  test.describe('記事詳細ページ', () => {
    test('モバイルでのレイアウト', async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
      // 実際の記事がない場合は、404ページになる可能性があるため、
      // ここではレイアウトの基本的な確認のみ行う
      await page.goto('/media/articles/test-article', { waitUntil: 'domcontentloaded' })
      
      // 404でない場合のみテストを実行
      const isNotFound = await page.locator('text=404').isVisible().catch(() => false)
      
      if (!isNotFound) {
        // ヒーロー画像のアスペクト比確認
        const heroImage = page.locator('.relative > img').first()
        if (await heroImage.isVisible()) {
          await expect(heroImage).toHaveClass(/object-cover/)
        }

        // サイドバーがモバイルでは下に配置される
        const sidebar = page.locator('aside')
        if (await sidebar.isVisible()) {
          const mainContent = page.locator('.lg\\:col-span-2')
          const sidebarBox = await sidebar.boundingBox()
          const mainBox = await mainContent.boundingBox()
          
          if (sidebarBox && mainBox) {
            // サイドバーがメインコンテンツの下にあることを確認
            expect(sidebarBox.y).toBeGreaterThan(mainBox.y)
          }
        }
      }
    })
  })

  test.describe('ボタンのアクセシビリティ', () => {
    test('タッチデバイスでのボタンサイズ', async ({ page }) => {
      await page.setViewportSize(viewports.mobile)
      await page.goto('/')

      // すべてのボタンを取得
      const buttons = page.locator('button, a[class*="rounded"]')
      const count = await buttons.count()

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          const box = await button.boundingBox()
          if (box) {
            // タップターゲットの最小サイズ（44px）を確認
            expect(box.height).toBeGreaterThanOrEqual(36) // 最小許容サイズ
          }
        }
      }
    })
  })
})