import { vi, afterEach } from 'vitest'

// Node環境専用のセットアップ
// Consoleメソッドのモック
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
}

// テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks()
})

// Node.js環境用のテストセットアップファイル