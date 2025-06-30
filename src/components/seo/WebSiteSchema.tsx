import { StructuredData } from './StructuredData';

/**
 * WebSite構造化データを生成するコンポーネント
 * @doc https://schema.org/WebSite
 * @related src/app/layout.tsx
 */
export function WebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crypto-media.jp';
  
  const webSiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Crypto Media',
    alternateName: 'クリプトメディア',
    url: baseUrl,
    description: '仮想通貨・ブロックチェーンの最新情報、投資戦略、税金対策などを網羅的に提供するメディアプラットフォーム',
    publisher: {
      '@type': 'Organization',
      name: 'Crypto Media',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/media/articles?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'ja-JP',
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@type': 'Organization',
      name: 'Crypto Media',
    },
  };

  return <StructuredData data={webSiteData} />;
}