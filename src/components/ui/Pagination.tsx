/**
 * ページネーションコンポーネント
 * @doc DEVELOPMENT_GUIDE.md#UI/UXコンポーネント
 * @issue #28 - 記事一覧ページの機能拡張
 */
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
// Heroiconsの代わりにシンプルなSVGアイコンを使用
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath?: string
  className?: string
  siblingCount?: number
}

/**
 * ページネーションコンポーネント
 * @param currentPage 現在のページ番号
 * @param totalPages 総ページ数
 * @param basePath ページネーションのベースパス
 * @param className 追加のCSSクラス
 * @param siblingCount 現在ページの前後に表示するページ数
 */
export function Pagination({ 
  currentPage, 
  totalPages, 
  basePath,
  className = '',
  siblingCount = 2
}: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /**
   * ページ番号付きのURLを生成
   * @param page ページ番号
   * @returns URL文字列
   */
  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    const basePathWithQuery = basePath ? basePath.split('?')[0] : pathname
    const existingQuery = basePath ? basePath.split('?')[1] : ''
    
    const newParams = new URLSearchParams(existingQuery)
    searchParams?.forEach((value, key) => {
      if (key !== 'page') {
        newParams.set(key, value)
      }
    })
    newParams.set('page', page.toString())

    // `q` パラメータが `basePath` に含まれている場合、それを優先する
    if (basePath && new URLSearchParams(basePath.split('?')[1] || '').has('q')) {
        const basePathParams = new URLSearchParams(basePath.split('?')[1] || '')
        basePathParams.set('page', page.toString())
        return `${basePath.split('?')[0]}?${basePathParams.toString()}`
    }

    return `${basePathWithQuery}?${newParams.toString()}`
  }

  /**
   * 表示するページ番号の配列を生成
   * @returns ページ番号の配列
   */
  const getPageNumbers = (): (number | string)[] => {
    const delta = siblingCount
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []
    let l: number | undefined

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav 
      className={`flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 ${className}`}
      aria-label="ページネーション"
    >
      <div className="-mt-px flex w-0 flex-1">
        {currentPage > 1 && (
          <Link
            href={createPageURL(currentPage - 1)}
            className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            <ChevronLeftIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            前へ
          </Link>
        )}
      </div>
      
      <div className="hidden md:-mt-px md:flex">
        {pageNumbers.map((page, index) => (
          typeof page === 'number' ? (
            <Link
              key={index}
              href={createPageURL(page)}
              className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                page === currentPage
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          ) : (
            <span
              key={index}
              className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500"
            >
              {page}
            </span>
          )
        ))}
      </div>
      
      <div className="-mt-px flex w-0 flex-1 justify-end">
        {currentPage < totalPages && (
          <Link
            href={createPageURL(currentPage + 1)}
            className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            次へ
            <ChevronRightIcon className="ml-3 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  )
}