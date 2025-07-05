import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // テスト対象を明示的に指定
    include: ['src/**/*.node.test.ts', 'src/app/api/**/*.test.ts', 'src/lib/**/*.test.ts'],
    // JSDOMテストを明確に除外
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      '**/*.test.tsx',
    ],
    environment: 'node',
    setupFiles: ['src/test/setup-node.ts'],
    testTimeout: process.env.CI ? 60000 : 30000, // CI環境では60秒
    hookTimeout: process.env.CI ? 60000 : 30000, // CI環境では60秒
    pool: 'forks',  // スレッドよりも高速なプロセスベースの並列化
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? 2 : undefined,  // CI環境では2コアを想定、ローカルではVitestの自動設定に任せる
        minForks: 1,
      },
    },
    // テストの分離を維持（テスト間の干渉を防ぐため）
    isolate: true,
    // 依存関係の最適化設定
    deps: {
      optimizer: {
        ssr: {
          exclude: ['@next-auth/*', '@stripe/*'],
        },
      },
    },
    // カバレッジ設定
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
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
      // all: true はパフォーマンスに影響するため削除
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
})
