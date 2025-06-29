'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function MediaHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  const navItems = [
    { href: '/media', label: 'トップ' },
    { href: '/media/category/news', label: 'ニュース' },
    { href: '/media/category/analysis', label: '分析' },
    { href: '/media/category/learn', label: '学習' },
    { href: '/media/category/trends', label: 'トレンド' },
  ]

  return (
    <header className="bg-gray-900 text-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/media" className="flex-shrink-0">
              <span className="text-xl font-bold">Crypto Media</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="ml-4 flex items-center space-x-4">
                {session ? (
                  <>
                    <Link
                      href="/media/mypage"
                      className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                    >
                      マイページ
                    </Link>
                    <Link
                      href="/api/auth/signout"
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      ログアウト
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                    >
                      ログイン
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      無料会員登録
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">メニューを開く</span>
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="mt-4 space-y-1 border-t border-gray-700 pt-4">
              {session ? (
                <>
                  <Link
                    href="/media/mypage"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    マイページ
                  </Link>
                  <Link
                    href="/api/auth/signout"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ログアウト
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    無料会員登録
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}