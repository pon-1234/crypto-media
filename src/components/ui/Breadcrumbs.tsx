import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/**
 * Breadcrumb item type definition
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string
  /** URL to link to (optional for the last item) */
  href?: string
}

/**
 * Props for the Breadcrumbs component
 */
export interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[]
  /** Additional CSS classes */
  className?: string
}

/**
 * Breadcrumbs navigation component
 *
 * @doc Displays hierarchical navigation breadcrumbs
 * @related src/app/media/category/[slug]/page.tsx - Used in category pages
 * @related src/app/media/tag/[slug]/page.tsx - Used in tag pages
 * @param props - Component props
 * @returns Breadcrumbs navigation element
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
}) => {
  return (
    <nav
      aria-label="パンくずリスト"
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight
                  className="mx-1 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              )}
              {isLast || !item.href ? (
                <span
                  className="text-gray-700 dark:text-gray-300"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
