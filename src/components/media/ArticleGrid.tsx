import React from 'react'
import { clsx } from 'clsx'
import { ArticleCard } from './ArticleCard'
import type { MediaArticle } from '@/lib/schema'

/**
 * Props for the ArticleGrid component
 */
export interface ArticleGridProps {
  /** Array of articles to display */
  articles: MediaArticle[]
  /** Number of columns for the grid (responsive) */
  columns?: {
    sm?: number
    md?: number
    lg?: number
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * Article grid layout component
 *
 * @doc Displays a responsive grid of article cards
 * @related src/components/media/ArticleCard.tsx - Individual article card component
 * @param props - Component props
 * @returns Grid of article cards
 */
export const ArticleGrid: React.FC<ArticleGridProps> = ({
  articles,
  columns = { sm: 1, md: 2, lg: 3 },
  className = '',
}) => {
  if (articles.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          記事が見つかりませんでした。
        </p>
      </div>
    )
  }

  const gridClasses = clsx(
    'grid gap-6',
    {
      'grid-cols-1': columns.sm === 1,
      'grid-cols-2': columns.sm === 2,
      'grid-cols-3': columns.sm === 3,
      'grid-cols-4': columns.sm === 4,
      'md:grid-cols-1': columns.md === 1,
      'md:grid-cols-2': columns.md === 2,
      'md:grid-cols-3': columns.md === 3,
      'md:grid-cols-4': columns.md === 4,
      'lg:grid-cols-1': columns.lg === 1,
      'lg:grid-cols-2': columns.lg === 2,
      'lg:grid-cols-3': columns.lg === 3,
      'lg:grid-cols-4': columns.lg === 4,
    },
    className
  )

  return (
    <div className={gridClasses}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
