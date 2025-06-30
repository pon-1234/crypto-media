import { MetadataRoute } from 'next';
import { client } from '@/lib/microcms/client';
import type { MediaArticle } from '@/lib/schema/article.schema';
import type { CorporateNews } from '@/lib/schema/corporate-news.schema';
import type { Category } from '@/lib/schema/category.schema';
import type { Tag } from '@/lib/schema/tag.schema';
import type { Expert } from '@/lib/schema/expert.schema';
import type { Feature } from '@/lib/schema/feature.schema';

/**
 * 動的サイトマップを生成
 * @doc https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 * @related src/app/robots.ts
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crypto-media.jp';
  
  // 現在の日時
  const now = new Date();
  
  // 静的ページのサイトマップエントリ
  const staticPages: MetadataRoute.Sitemap = [
    // コーポレートサイト
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/service`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recruit`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/dealing`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // メディアサイト
    {
      url: `${baseUrl}/media`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/media/articles`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/media/category`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/media/tag`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/media/experts`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/media/feature`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/media/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/media/premium`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/media/survey`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/media/glossary`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/media/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/media/editorial-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/media/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // 認証関連
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // 動的コンテンツの取得
    const [articles, corporateNews, categories, tags, experts, features] = await Promise.all([
      // メディア記事
      client.get<{ contents: MediaArticle[] }>({
        endpoint: 'media_articles',
        queries: {
          limit: 1000,
          fields: 'id,slug,updatedAt',
        },
      }),
      // コーポレートニュース
      client.get<{ contents: CorporateNews[] }>({
        endpoint: 'corporate_news',
        queries: {
          limit: 1000,
          fields: 'id,updatedAt',
        },
      }),
      // カテゴリ
      client.get<{ contents: Category[] }>({
        endpoint: 'categories',
        queries: {
          limit: 100,
          fields: 'id,slug',
        },
      }),
      // タグ
      client.get<{ contents: Tag[] }>({
        endpoint: 'tags',
        queries: {
          limit: 200,
          fields: 'id,slug',
        },
      }),
      // 執筆者・監修者
      client.get<{ contents: Expert[] }>({
        endpoint: 'experts',
        queries: {
          limit: 100,
          fields: 'id,slug',
        },
      }),
      // 特集
      client.get<{ contents: Feature[] }>({
        endpoint: 'features',
        queries: {
          limit: 100,
          fields: 'id,slug',
        },
      }),
    ]);

    // 動的ページのサイトマップエントリ
    const dynamicPages: MetadataRoute.Sitemap = [
      // メディア記事詳細
      ...articles.contents.map((article) => ({
        url: `${baseUrl}/media/articles/${article.slug}`,
        lastModified: new Date(article.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      // コーポレートニュース詳細
      ...corporateNews.contents.map((news) => ({
        url: `${baseUrl}/news/${news.id}`,
        lastModified: new Date(news.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
      // カテゴリ別記事一覧
      ...categories.contents.map((category) => ({
        url: `${baseUrl}/media/category/${category.slug}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      })),
      // タグ別記事一覧
      ...tags.contents.map((tag) => ({
        url: `${baseUrl}/media/tag/${tag.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })),
      // 執筆者・監修者詳細
      ...experts.contents.map((expert) => ({
        url: `${baseUrl}/media/experts/${expert.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
      // 特集詳細
      ...features.contents.map((feature) => ({
        url: `${baseUrl}/media/feature/${feature.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ];

    return [...staticPages, ...dynamicPages];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    // エラーが発生した場合は静的ページのみ返す
    return staticPages;
  }
}