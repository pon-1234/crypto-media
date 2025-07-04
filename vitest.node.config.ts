import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/app/api/**/*.test.ts', 'src/lib/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      'e2e/**',
      // JSXファイルは除外（JSDOMテスト用）
      '**/*.test.tsx',
      '**/*.spec.tsx',
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
