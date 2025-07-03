import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'
import { getServerSession, Session } from 'next-auth'
import { adminDb } from '@/lib/firebase/admin'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import type { NextRequest } from 'next/server'


vi.mock('next-auth')
vi.mock('@/lib/firebase/admin', () => {
  const mockCollection = vi.fn((collectionName: string) => {
    if (collectionName === 'audit_logs') {
      return {
        add: vi.fn().mockResolvedValue({}),
      }
    }
    return {
      doc: vi.fn().mockReturnThis(),
      get: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    }
  })

  return {
    adminDb: {
      collection: mockCollection,
    },
  }
})
vi.mock('@/lib/auth/password')
vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
    remaining: 4,
    reset: Date.now() / 1000 + 60,
  }),
}))

describe('PATCH /api/account/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession: Session = {
    user: { id: 'test-user' },
    expires: '2025-01-01T00:00:00.000Z',
  }
  const mockUserDoc = {
    exists: true,
    data: () => ({ passwordHash: 'hashed_password' }),
  }

  it('セッションがない場合、401エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const req = new Request('http://localhost', { method: 'PATCH' })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(401)
  })

  it('新しいパスワードが一致しない場合、400エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: '1',
        newPassword: 'new',
        confirmPassword: 'wrong',
      }),
    })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(400)
  })

  it('現在のパスワードが間違っている場合、400エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const mockGet = vi.fn().mockResolvedValue(mockUserDoc)
    const mockDoc = vi.fn().mockReturnValue({ get: mockGet, update: vi.fn() })
    const mockCollection = vi.fn((collectionName: string) => {
      if (collectionName === 'users') {
        return { doc: mockDoc }
      }
      return { add: vi.fn() }
    })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection as ReturnType<typeof vi.fn>)
    vi.mocked(verifyPassword).mockResolvedValue(false)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: 'wrong',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }),
    })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('現在のパスワードが違います')
  })

  it('パスワードの更新に成功した場合、204を返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const mockUpdate = vi.fn().mockResolvedValue({})
    const mockGet = vi.fn().mockResolvedValue(mockUserDoc)
    const mockDoc = vi.fn().mockReturnValue({ get: mockGet, update: mockUpdate })
    const mockCollection = vi.fn((collectionName: string) => {
      if (collectionName === 'users') {
        return { doc: mockDoc }
      }
      return { add: vi.fn() }
    })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection as ReturnType<typeof vi.fn>)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(hashPassword).mockResolvedValue('new_hashed_password')

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }),
    })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(204)
    expect(mockUpdate).toHaveBeenCalledWith({
      passwordHash: 'new_hashed_password',
    })
  })

  it('DBエラーの場合、500エラーを返す', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const mockGet = vi.fn().mockRejectedValue(new Error('DB Error'))
    const mockDoc = vi.fn().mockReturnValue({ get: mockGet, update: vi.fn() })
    const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc })
    vi.mocked(adminDb.collection).mockImplementation(mockCollection as ReturnType<typeof vi.fn>)
     const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }),
    })
    const res = await PATCH(req as NextRequest)
    expect(res.status).toBe(500)
  })
}) 