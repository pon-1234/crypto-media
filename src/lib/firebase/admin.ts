import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { isTestOrCI } from '@/lib/env/detect'

/**
 * Firebase Admin SDK initialization
 * @doc Initializes Firebase Admin SDK for server-side operations
 * @related src/app/api/stripe/webhook/route.ts - Uses this to update user membership status
 */
const initializeFirebaseAdmin = () => {
  // CI環境またはテスト環境ではモックアプリを返す
  if (isTestOrCI()) {
    return null
  }

  if (getApps().length > 0) {
    return getApps()[0]
  }

  if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    throw new Error('Firebase Admin environment variables are not configured')
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

// Initialize the app
const app = initializeFirebaseAdmin()

// Export Firestore instance
export const adminDb = isTestOrCI()
  ? // CI環境またはテスト環境ではモックインスタンスを返す
    ({
      collection: () => ({
        doc: () => ({
          set: async () => ({}),
          get: async () => ({ exists: false, data: () => ({}) }),
          update: async () => ({}),
          delete: async () => ({}),
        }),
        add: async () => ({ id: 'mock-id' }),
        where: () => ({
          get: async () => ({ empty: true, docs: [] }),
        }),
        get: async () => ({ empty: true, docs: [] }),
      }),
    } as unknown as Firestore)
  : getFirestore(app!)
