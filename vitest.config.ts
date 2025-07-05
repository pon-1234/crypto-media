import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    testTimeout: process.env.CI ? 60000 : 30000, // CI環境では60秒、ローカルでは30秒
    hookTimeout: process.env.CI ? 60000 : 30000, // CI環境では60秒、ローカルでは30秒
    // 並列実行の設定を追加
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? 2 : 4, // CI環境では2つに制限
        minForks: 1,
      },
    },
    // テストの分離を改善
    isolate: true,
    // テスト対象を明示的に指定
    include: ['src/**/*.test.tsx'],
    // Node.jsテストを明確に除外
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      '**/*.node.test.ts',
      'src/app/api/**/*.test.ts',
      'src/lib/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
