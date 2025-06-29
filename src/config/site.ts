/**
 * サイト全体の設定を管理する定数ファイル
 * @doc https://example.co.jp/docs/site-config
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

export const SITE_CONFIG = {
  /**
   * サイトメタ情報
   */
  meta: {
    siteName: 'Crypto Media',
    corporateName: 'Example Corporation',
    domain: 'example.co.jp',
    defaultDescription: '暗号資産・ブロックチェーンの最新情報をお届けするメディアサイト',
    defaultOgImage: '/images/og-default.png',
  },

  /**
   * URL構成
   */
  urls: {
    corporate: {
      top: '/',
      about: '/about/',
      service: '/service/',
      recruit: '/recruit/',
      news: '/news/',
      contact: '/contact/',
      terms: '/terms/',
      privacyPolicy: '/privacy-policy/',
      dealing: '/dealing/',
    },
    media: {
      top: '/media/',
      articles: '/media/articles/',
      categories: '/media/category/',
      tags: '/media/tag/',
      experts: '/media/experts/',
      features: '/media/feature/',
      news: '/media/news/',
      premium: '/media/premium/',
      survey: '/media/survey/',
      glossary: '/media/glossary/',
      faq: '/media/faq/',
      editorialPolicy: '/media/editorial-policy/',
      contact: '/media/contact/',
    },
    auth: {
      register: '/register/',
      login: '/login/',
      mypage: '/media/mypage/',
      membership: '/media/mypage/membership/',
      settings: '/media/mypage/settings/',
      support: '/media/mypage/support/',
    },
  },

  /**
   * 会員区分
   */
  membership: {
    types: {
      GUEST: 'guest' as const,
      FREE: 'free' as const,
      PAID: 'paid' as const,
    },
    price: {
      monthly: 1980,
      currency: 'JPY' as const,
    },
  },

  /**
   * SEO・パフォーマンス目標値
   */
  performance: {
    cwv: {
      lcp: 2000, // Largest Contentful Paint < 2s
      fid: 100, // First Input Delay < 100ms
      cls: 0.1, // Cumulative Layout Shift < 0.1
    },
    lighthouse: {
      minScore: {
        performance: 90,
        accessibility: 90,
        bestPractices: 90,
        seo: 90,
      },
    },
  },

  /**
   * ISR設定
   */
  revalidate: {
    default: 60, // 1分
    article: 300, // 5分
    static: 3600, // 1時間
  },

  /**
   * ページネーション
   */
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;