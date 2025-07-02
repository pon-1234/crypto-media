import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '特集ページ',
};

const SpecialPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">特集ページ</h1>
      <p className="mt-4">こちらは特集ページです。コンテンツは準備中です。</p>
    </div>
  );
};

export default SpecialPage; 