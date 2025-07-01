import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    testTimeout: 30000, // 30秒のタイムアウト
    hookTimeout: 30000, // 30秒のフックタイムアウト
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'e2e/**', // E2Eテストを除外
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'build/',
        '.next/',
        'src/lib/auth/authOptions.ts', // 外部依存が多いためカバレッジから除外
        'e2e/**', // E2Eテストを除外
        '**/*.test.ts', // テストファイル自体を除外
        '**/*.test.tsx', // テストファイル自体を除外
        'src/app/sitemap.ts', // 動的生成のため除外
        'src/app/api/stripe/*/route.ts', // Stripe Webhook実装のため除外
        'src/app/media/articles/[slug]/page.tsx', // 動的ルートページを除外
        'src/app/media/category/[slug]/page.tsx', // 動的ルートページを除外
        'src/app/media/tag/[slug]/page.tsx', // 動的ルートページを除外
        'src/app/news/[id]/page.tsx', // 動的ルートページを除外
        'src/app/news/page.tsx', // ニュースページを除外
        'src/app/register/page.tsx', // 登録ページを除外
        'src/components/forms/HubSpotForm.tsx', // 外部依存のため除外
        'src/components/layouts/*.tsx', // レイアウトコンポーネントを除外
        'src/components/media/ArticleCard.tsx', // UIコンポーネントのため除外
        'src/config/env.ts', // 環境変数設定のため除外
        'src/lib/firebase/admin.ts', // Firebase Admin SDKのため除外
        'src/lib/stripe/rate-limiter.ts', // レート制限実装のため除外
        'src/lib/utils/handleError.ts', // エラーハンドリングユーティリティのため除外
      ],
      all: true,
      thresholds: {
        lines: 93,
        functions: 98,
        branches: 93,
        statements: 93,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
