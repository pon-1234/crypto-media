import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

/**
 * NextAuth.js APIルート
 * @doc https://next-auth.js.org/configuration/initialization#route-handlers-app
 * @related src/lib/auth/authOptions.ts - NextAuth設定
 * @issue #1 - 初期セットアップ：NextAuth.jsによる認証実装
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }