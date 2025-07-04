import { PATCH } from '../route'
import { getServerSession, Session } from 'next-auth'
import { adminDb } from '@/lib/firebase/admin'
import type { NextRequest } from 'next/server'
import { WriteResult } from 'firebase-admin/firestore'

// モックの設定
vi.mock('next-auth')
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    update: vi.fn(),
  },
}))

describe('PATCH /api/account/profile', () => {
  const mockSession: Session = {
    user: { id: 'test-user', email: 'test@example.com' },
    expires: '2025-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('セッションがない場合、401エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const req = new Request('http://localhost', { method: 'PATCH' })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(401)
  })

  it('ユーザーIDがない場合、401エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: '2025-01-01T00:00:00.000Z',
    })
    const req = new Request('http://localhost', { method: 'PATCH' })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(401)
  })

  it('リクエストボディが不正な場合、400エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(400)
  })

  it('プロフィールの更新に成功した場合、200を返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(adminDb.collection('users').doc().update).mockResolvedValue(
      {} as WriteResult
    )

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    })
    const res = await PATCH(req as NextRequest)

    expect(adminDb.collection).toHaveBeenCalledWith('users')
    expect(adminDb.collection('users').doc).toHaveBeenCalledWith('test-user')
    expect(adminDb.collection('users').doc().update).toHaveBeenCalledWith({
      name: 'New Name',
    })
    expect(res.status).toBe(200)
  })

  it('データベースの更新に失敗した場合、500エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(adminDb.collection('users').doc().update).mockRejectedValue(
      new Error('DB error')
    )

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(500)
  })
})
