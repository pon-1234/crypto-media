import { type Metadata } from 'next'

import { generatePageMetadata } from '@/lib/metadata/generateMetadata'

/**
 * 会社概要ページ
 * @doc https://github.com/pon-1234/crypto-media/issues/12
 * @issue #12 - コーポレート静的ページの実装
 */
export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">会社概要</h1>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">私たちについて</h2>
          <p className="mb-4 leading-relaxed text-gray-700">
            私たちは、暗号資産・ブロックチェーン技術の最新情報を発信するメディアプラットフォームを運営しています。
            複雑な技術や金融の世界を、誰にでもわかりやすく解説することを使命としています。
          </p>
          <p className="leading-relaxed text-gray-700">
            業界の専門家による監修のもと、正確で信頼性の高い情報提供を心がけ、
            読者の皆様が安心して暗号資産の世界に足を踏み入れられるようサポートいたします。
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold">会社情報</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-medium text-gray-900">
                    会社名
                  </th>
                  <td className="px-6 py-4 text-gray-700">
                    株式会社クリプトメディア
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-medium text-gray-900">
                    設立
                  </th>
                  <td className="px-6 py-4 text-gray-700">2023年4月1日</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-medium text-gray-900">
                    代表取締役
                  </th>
                  <td className="px-6 py-4 text-gray-700">山田 太郎</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-medium text-gray-900">
                    資本金
                  </th>
                  <td className="px-6 py-4 text-gray-700">1,000万円</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-medium text-gray-900">
                    所在地
                  </th>
                  <td className="px-6 py-4 text-gray-700">
                    〒100-0001
                    <br />
                    東京都千代田区千代田1-1-1
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-medium text-gray-900">
                    従業員数
                  </th>
                  <td className="px-6 py-4 text-gray-700">
                    25名（2025年1月現在）
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-6 py-4 text-left font-medium text-gray-900">
                    事業内容
                  </th>
                  <td className="px-6 py-4 text-gray-700">
                    暗号資産・ブロックチェーン関連メディアの運営
                    <br />
                    調査・分析レポートの作成
                    <br />
                    教育コンテンツの提供
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">ミッション</h2>
          <div className="rounded-lg bg-blue-50 p-6">
            <p className="text-center text-lg font-medium text-blue-900">
              「暗号資産の世界を、もっと身近に、もっと安心に」
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">ビジョン</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              正確で信頼できる情報の提供を通じて、暗号資産市場の健全な発展に貢献する
            </li>
            <li>
              初心者から上級者まで、すべての人に価値ある知識とインサイトを届ける
            </li>
            <li>ブロックチェーン技術が創る新しい未来を、わかりやすく伝える</li>
          </ul>
        </section>
      </div>
    </main>
  )
}

export const metadata: Metadata = generatePageMetadata({
  title: '会社概要',
  description:
    '株式会社クリプトメディアの会社概要です。私たちは暗号資産・ブロックチェーン技術の最新情報を発信するメディアプラットフォームを運営しています。',
  path: '/about',
})
