import { type Metadata } from 'next'

import { generatePageMetadata } from '@/lib/metadata/generateMetadata'

/**
 * 事業内容ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/12
 * @issue #12 - コーポレート静的ページの実装
 */
export default function ServicePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">事業内容</h1>

        <section className="mb-12">
          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            私たちは、暗号資産・ブロックチェーン業界に特化したメディア事業を展開しています。
            最新ニュースの配信から専門的な分析レポート、教育コンテンツまで、
            幅広いサービスを通じて、業界の発展に貢献しています。
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold">提供サービス</h2>

          <div className="space-y-8">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-blue-600">
                1. 暗号資産メディア「Crypto Media」の運営
              </h3>
              <p className="mb-4 text-gray-700">
                国内外の暗号資産・ブロックチェーン関連ニュースを日々配信。
                専門家による解説記事や、初心者向けガイドなど、幅広い読者層に対応したコンテンツを提供しています。
              </p>
              <ul className="list-inside list-disc space-y-1 text-gray-600">
                <li>最新ニュース・速報の配信</li>
                <li>専門家による市場分析・解説</li>
                <li>初心者向け学習コンテンツ</li>
                <li>用語集・FAQ の整備</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-blue-600">
                2. 調査・分析レポートサービス
              </h3>
              <p className="mb-4 text-gray-700">
                独自の調査・分析に基づいた詳細なレポートを定期的に発行。
                有料会員向けに、より深い洞察と投資判断に役立つ情報を提供しています。
              </p>
              <ul className="list-inside list-disc space-y-1 text-gray-600">
                <li>月次市場分析レポート</li>
                <li>プロジェクト詳細調査</li>
                <li>規制動向分析</li>
                <li>技術トレンドレポート</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-blue-600">
                3. 有料会員サービス
              </h3>
              <p className="mb-4 text-gray-700">
                月額1,980円で、すべてのプレミアムコンテンツにアクセス可能。
                専門的な分析記事や調査レポート、限定セミナーへの参加権など、
                より深い知識を求める方向けのサービスです。
              </p>
              <ul className="list-inside list-disc space-y-1 text-gray-600">
                <li>全プレミアム記事の閲覧</li>
                <li>調査レポートのダウンロード</li>
                <li>会員限定ウェビナーへの参加</li>
                <li>優先サポート</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-blue-600">
                4. 教育・啓蒙活動
              </h3>
              <p className="mb-4 text-gray-700">
                暗号資産・ブロックチェーン技術の正しい理解を広めるため、
                各種教育コンテンツの制作や、セミナー・ワークショップの開催を行っています。
              </p>
              <ul className="list-inside list-disc space-y-1 text-gray-600">
                <li>初心者向け入門講座</li>
                <li>技術者向けワークショップ</li>
                <li>企業向け研修プログラム</li>
                <li>教育機関との連携</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold">サービスの特徴</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-blue-900">
                信頼性
              </h3>
              <p className="text-gray-700">
                業界の専門家による監修と、独自の調査に基づいた正確な情報提供
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-green-900">
                わかりやすさ
              </h3>
              <p className="text-gray-700">
                初心者にも理解しやすい解説と、視覚的にわかりやすいコンテンツ設計
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-purple-900">
                速報性
              </h3>
              <p className="text-gray-700">
                国内外の最新情報を迅速にキャッチし、いち早く読者にお届け
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-orange-900">
                専門性
              </h3>
              <p className="text-gray-700">
                技術的な深掘りから投資分析まで、専門的な視点での情報提供
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">お問い合わせ</h2>
          <div className="rounded-lg bg-gray-50 p-6 text-center">
            <p className="mb-4 text-gray-700">
              サービスについてのご質問・ご相談は、お気軽にお問い合わせください。
            </p>
            <a
              href="/contact"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              お問い合わせはこちら
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

export const metadata: Metadata = generatePageMetadata({
  title: '事業内容',
  description:
    '株式会社クリプトメディアの事業内容をご紹介します。暗号資産メディアの運営、調査レポートの作成、有料会員サービス、教育活動など幅広いサービスを提供しています。',
  path: '/service',
})
