import type { FC } from 'react'
import Link from 'next/link'

/**
 * ページネーションコンポーネント
 */

interface PaginationProps {
  /**
   * 現在のページ番号
   */
  currentPage: number
  /**
   * 総ページ数
   */
  totalPages: number
  /**
   * ページネーションのリンクのベースパス
   * 例: /news
   */
  basePath: string
  /**
   * 現在ページの前後何ページを表示するか
   */
  siblingCount?: number
}

export const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  basePath,
  siblingCount = 2,
}) => {
  if (totalPages <= 1) {
    return null
  }

  const pageNumbers: (number | '...')[] = []

  // 開始ページ
  const startPage = Math.max(1, currentPage - siblingCount)
  // 終了ページ
  const endPage = Math.min(totalPages, currentPage + siblingCount)

  // 最初のページと省略記号を追加
  if (startPage > 1) {
    pageNumbers.push(1)
    if (startPage > 2) {
      pageNumbers.push('...')
    }
  }

  // 間のページ番号を追加
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  // 最後のページと省略記号を追加
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push('...')
    }
    pageNumbers.push(totalPages)
  }

  return (
    <nav className="mt-8 flex justify-center">
      <ul className="flex space-x-2">
        {/* 前へ */}
        {currentPage > 1 && (
          <li>
            <Link
              href={`${basePath}?page=${currentPage - 1}`}
              className="rounded border px-4 py-2 transition-colors hover:bg-gray-100"
            >
              前へ
            </Link>
          </li>
        )}

        {/* ページ番号 */}
        {pageNumbers.map((page, index) => (
          <li key={`${page}-${index}`}>
            {page === '...' ? (
              <span className="px-4 py-2">...</span>
            ) : (
              <Link
                href={`${basePath}?page=${page}`}
                className={`rounded border px-4 py-2 transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {page}
              </Link>
            )}
          </li>
        ))}

        {/* 次へ */}
        {currentPage < totalPages && (
          <li>
            <Link
              href={`${basePath}?page=${currentPage + 1}`}
              className="rounded border px-4 py-2 transition-colors hover:bg-gray-100"
            >
              次へ
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
