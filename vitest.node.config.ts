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
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? 2 : 4, // CI環境では2つに制限
        minForks: 1,
      },
    },
    coverage: process.env.CI === 'true' ? {
      enabled: true,
      provider: 'v8',
      reporter: ['json', 'json-summary', 'text'],
      reportsDirectory: './coverage/node',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    } : {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
