import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 環境変数を設定
    env: {
      NODE_ENV: 'test',
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    testTimeout: process.env.CI ? 120000 : 60000, // CI環境では120秒、ローカルでは60秒
    hookTimeout: process.env.CI ? 120000 : 60000, // CI環境では120秒、ローカルでは60秒
    // 並列実行の設定
    pool: 'forks',  // スレッドよりも高速なプロセスベースの並列化
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? 2 : undefined,  // CI環境では2コアを想定、ローカルではVitestの自動設定に任せる
        minForks: 1,
      },
    },
    // テストの分離を維持（テストの独立性を保証）
    isolate: true,
    // 依存関係の最適化設定
    deps: {
      optimizer: {
        web: {
          exclude: ['@next-auth/*', '@stripe/*', 'firebase-admin/*'],
        },
      },
    },
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