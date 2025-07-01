import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * ミドルウェア - 認証とレイアウト制御
 *
 * @doc DEVELOPMENT_GUIDE.md#認証・会員DB
 * @issue #7 - 認証UI（ログインページとヘッダー）の実装
 * @param request - Next.jsのリクエストオブジェクト
 * @returns レスポンスまたはリダイレクト
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isMediaPath = pathname.startsWith('/media/')

  // 認証が必要なパスの定義
  const protectedPaths = [
    '/media/mypage',
    '/media/mypage/membership',
    '/media/mypage/settings',
    '/media/mypage/support',
  ]

  // 現在のパスが保護されたパスかチェック
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  // 認証チェック
  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      // 未認証の場合はログインページにリダイレクト
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  const response = NextResponse.next()

  // レイアウトタイプをヘッダーに設定
  response.headers.set('x-layout-type', isMediaPath ? 'media' : 'corporate')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
