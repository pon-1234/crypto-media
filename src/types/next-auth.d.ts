import { DefaultSession } from 'next-auth'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      provider?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    provider?: string
  }
}
