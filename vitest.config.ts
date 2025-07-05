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
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // 計測対象をsrcディレクトリに限定
      include: ['src/**'],
      // 計測から除外するファイル
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/*.d.ts',
        'src/test/**',
        'src/types/**',
        'e2e/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        // Next.jsの特殊ファイル
        'src/app/layout.tsx',
        'src/app/error.tsx',
        'src/app/not-found.tsx',
        'src/middleware.ts',
      ],
      // CI環境では閾値チェックを行う
      thresholds: process.env.CI
        ? {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
          }
        : undefined,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
