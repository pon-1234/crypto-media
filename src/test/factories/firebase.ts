/**
 * Firebaseテスト用のファクトリ関数
 * @doc DEVELOPMENT_GUIDE.md#テストの実装
 * @related src/lib/firebase/admin.ts - Firebase Admin SDK
 * @issue #7 - NextAuth.js + Firebase認証の実装
 */

import type { DocumentReference, DocumentSnapshot, QuerySnapshot, Transaction, WriteBatch } from 'firebase-admin/firestore'

/**
 * Firestore DocumentSnapshotのモックを生成
 * @param exists ドキュメントが存在するか
 * @param data ドキュメントデータ
 * @returns DocumentSnapshotのモック
 */
export function createMockDocumentSnapshot<T = any>(
  exists: boolean,
  data?: T
): DocumentSnapshot<T> {
  return {
    exists,
    id: 'doc_test_123',
    ref: createMockDocumentReference<T>(),
    data: exists ? () => data as T : () => undefined,
    get: (field: string) => data?.[field],
    isEqual: vi.fn(),
    createTime: { toDate: () => new Date(), toMillis: () => Date.now() },
    updateTime: { toDate: () => new Date(), toMillis: () => Date.now() },
    readTime: { toDate: () => new Date(), toMillis: () => Date.now() },
  } as unknown as DocumentSnapshot<T>
}

/**
 * Firestore DocumentReferenceのモックを生成
 * @returns DocumentReferenceのモック
 */
export function createMockDocumentReference<T = any>(): DocumentReference<T> {
  return {
    id: 'doc_test_123',
    path: 'test/doc_test_123',
    parent: null,
    firestore: null,
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    isEqual: vi.fn(),
    withConverter: vi.fn(),
    collection: vi.fn(),
    listCollections: vi.fn(),
    onSnapshot: vi.fn(),
  } as unknown as DocumentReference<T>
}

/**
 * Firestore QuerySnapshotのモックを生成
 * @param docs ドキュメントの配列
 * @returns QuerySnapshotのモック
 */
export function createMockQuerySnapshot<T = any>(
  docs: Array<{ exists: boolean; data?: T }>
): QuerySnapshot<T> {
  const mockDocs = docs.map(doc => createMockDocumentSnapshot(doc.exists, doc.data))
  
  return {
    docs: mockDocs,
    empty: mockDocs.length === 0,
    size: mockDocs.length,
    query: null,
    metadata: {
      hasPendingWrites: false,
      isFromCache: false,
    },
    docChanges: vi.fn(() => []),
    forEach: vi.fn((callback) => mockDocs.forEach(callback)),
    isEqual: vi.fn(),
  } as unknown as QuerySnapshot<T>
}

/**
 * Firestore Transactionのモックを生成
 * @returns Transactionのモック
 */
export function createMockTransaction(): Transaction {
  return {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  } as unknown as Transaction
}

/**
 * Firestore WriteBatchのモックを生成
 * @returns WriteBatchのモック
 */
export function createMockWriteBatch(): WriteBatch {
  return {
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
  } as unknown as WriteBatch
}

/**
 * Firestore Collectionのモックを生成
 * @returns Collectionのモック
 */
export function createMockCollection() {
  return {
    doc: vi.fn(() => createMockDocumentReference()),
    add: vi.fn(),
    where: vi.fn(() => ({
      get: vi.fn(),
      limit: vi.fn(() => ({
        get: vi.fn(),
      })),
      orderBy: vi.fn(() => ({
        get: vi.fn(),
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn(),
      limit: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
    limit: vi.fn(() => ({
      get: vi.fn(),
    })),
    get: vi.fn(),
    listDocuments: vi.fn(),
    onSnapshot: vi.fn(),
    isEqual: vi.fn(),
    withConverter: vi.fn(),
  }
}

/**
 * NextAuthユーザーセッションのモックを生成
 * @param overrides カスタマイズするプロパティ
 * @returns NextAuthセッションのモック
 */
export function createMockSession(overrides?: Partial<any>) {
  return {
    user: {
      id: 'user_test_123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

/**
 * Firebaseユーザーデータのモックを生成
 * @param overrides カスタマイズするプロパティ
 * @returns ユーザーデータのモック
 */
export function createMockUserData(overrides?: Partial<any>) {
  return {
    id: 'user_test_123',
    email: 'test@example.com',
    name: 'Test User',
    membership: 'free',
    membershipUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}