import { Metadata } from 'next'

/**
 * OGP画像生成のパラメータ
 */
interface OgImageParams {
  title: string
  description?: string
  type?: 'default' | 'article' | 'corporate' | 'media'
  category?: string
}

/**
 * URLSearchParamsを生成するヘルパー関数
 */
function createOgImageUrl(params: OgImageParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crypto-media.jp'
  const searchParams = new URLSearchParams()

  searchParams.append('title', params.title)
  if (params.description) searchParams.append('description', params.description)
  if (params.type) searchParams.append('type', params.type)
  if (params.category) searchParams.append('category', params.category)

  return `${baseUrl}/api/og?${searchParams.toString()}`
}

/**
 * ページメタデータ生成のオプション
 */
export interface GenerateMetadataOptions {
  title: string
  description: string
  path?: string
  ogType?: 'website' | 'article'
  ogImageParams?: OgImageParams
  ogImage?: string
  keywords?: string[]
  noindex?: boolean
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  category?: string
  tags?: string[]
}

/**
 * 統一されたメタデータを生成するヘルパー関数
 * @doc https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 * @related src/app/api/og/route.tsx
 */
export function generatePageMetadata(
  options: GenerateMetadataOptions
): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crypto-media.jp'
  const {
    title,
    description,
    path = '',
    ogType = 'website',
    ogImageParams,
    ogImage,
    keywords = [],
    noindex = false,
    publishedTime,
    modifiedTime,
    authors = [],
    category,
    tags = [],
  } = options

  const url = `${baseUrl}${path}`

  // OGP画像のURL生成
  const ogImageUrl = ogImage
    ? ogImage
    : ogImageParams
    ? createOgImageUrl(ogImageParams)
    : createOgImageUrl({ title, description, type: 'default' })

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title,
      description,
      url,
      siteName: 'Crypto Media',
      locale: 'ja_JP',
      type: ogType,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      site: '@cryptomedia_jp',
      creator: '@cryptomedia_jp',
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }

  // 記事固有のメタデータ
  if (ogType === 'article' && metadata.openGraph) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors,
      tags,
    }

    if (category) {
      metadata.openGraph.section = category
    }
  }

  return metadata
}
