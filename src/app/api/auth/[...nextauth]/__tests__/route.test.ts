/**
 * route.ts の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// モックハンドラーを定義
const mockHandler = vi.fn((req: any) => {
  return new Response(JSON.stringify({ message: 'Mocked NextAuth response' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// モックを設定
vi.mock('next-auth', () => ({
  default: vi.fn(() => mockHandler),
}));

vi.mock('@/lib/auth/authOptions', () => ({
  authOptions: {
    providers: [],
    secret: 'test-secret',
  },
}));

// ダイナミックインポートで route.ts を読み込む
const loadRoute = async () => {
  const module = await import('../route');
  return module;
};

describe('NextAuth Route Handlers', () => {
  let GET: any;
  let POST: any;

  beforeAll(async () => {
    const route = await loadRoute();
    GET = route.GET;
    POST = route.POST;
  });
  
  it('GETハンドラーが定義されている', () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('POSTハンドラーが定義されている', () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });

  it('GETリクエストが処理される', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/signin');
    const response = await GET(mockRequest);
    
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('POSTリクエストが処理される', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
    });
    const response = await POST(mockRequest);
    
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });
});