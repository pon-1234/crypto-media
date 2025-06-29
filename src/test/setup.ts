/**
 * Vitest Setup File
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// グローバルなfetch APIをモック
global.fetch = vi.fn();

// window.location.originを設定
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
});

// NEXTAUTH_URLを設定
process.env.NEXTAUTH_URL = 'http://localhost:3000';