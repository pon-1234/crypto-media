'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Media page error:', error)
  }, [error])

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
      <p className="text-red-600 mb-4">
        {process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'ページの読み込み中にエラーが発生しました。'}
      </p>
      {process.env.NODE_ENV === 'development' && error.stack && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm mb-4">
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        もう一度試す
      </button>
    </div>
  )
}