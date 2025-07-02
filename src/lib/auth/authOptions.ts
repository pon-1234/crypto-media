import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { FirestoreAdapter } from '@next-auth/firebase-adapter'
import { cert } from 'firebase-admin/app'
import { isTestOrCI } from '@/lib/env/detect'
import { adminDb } from '@/lib/firebase/admin'
import { verifyPassword } from '@/lib/auth/password'

/**
 * Firebase設定が有効かどうかを判定
 */
const hasValidFirebaseConfig =
  process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY !== 'test-private-key'

/**
 * NextAuth.js設定
 * @doc https://next-auth.js.org/configuration/options
 * @related src/app/api/auth/[...nextauth]/route.ts - NextAuth APIルート
 * @issue #1 - 初期セットアップ：NextAuth.jsによる認証実装
 * @issue #26 - 認証機能の拡張：メール/パスワード認証の追加
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Firestoreからユーザー情報を取得
          const usersSnapshot = await adminDb
            .collection('users')
            .where('email', '==', credentials.email)
            .limit(1)
            .get()

          if (usersSnapshot.empty) {
            return null
          }

          const userDoc = usersSnapshot.docs[0]
          const userData = userDoc.data()

          // パスワードハッシュが存在しない場合（GoogleログインのみのユーザーなどE）
          if (!userData.passwordHash) {
            return null
          }

          // パスワードを検証
          const isValid = await verifyPassword(
            credentials.password,
            userData.passwordHash
          )

          if (!isValid) {
            return null
          }

          // 認証成功
          return {
            id: userDoc.id,
            email: userData.email,
            name: userData.name,
            image: userData.image,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],
  // テスト環境またはFirebase未設定の場合はFirestoreAdapterを使用しない
  ...(!isTestOrCI() &&
    hasValidFirebaseConfig && {
      adapter: FirestoreAdapter({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
            /\\n/g,
            '\n'
          ),
        }),
      }),
    }),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/login?verify=1',
  },
}
