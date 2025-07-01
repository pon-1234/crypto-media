'use client'

import { SessionProvider } from 'next-auth/react'
import React from 'react'

/**
 * NextAuth.js SessionProviderのラッパーコンポーネント
 * クライアントサイドで認証状態を利用可能にする
 * @doc https://next-auth.js.org/getting-started/client#sessionprovider
 * @related src/lib/auth/authOptions.ts - NextAuth設定
 * @issue #1 - 初期セットアップ：NextAuth.jsによる認証実装
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
