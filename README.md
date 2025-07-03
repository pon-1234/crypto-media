# Crypto Media & Corporate Site

このリポジトリは、Next.js, microCMS, Firebase, Stripeで構築されたSEOメディア兼コーポレートサイトのフロントエンドです。

## ✨ 特徴

- Next.js (App Router)によるハイパフォーマンスな静的サイト生成
- microCMSによるHeadlessなコンテンツ管理
- FirebaseとStripeによる会員認証・決済基盤
- Claude CodeとGemini CLIを連携させたAI駆動の開発ワークフロー

## 🔧 技術スタック

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **CMS**: microCMS (Headless CMS)
- **Auth**: NextAuth.js with Firebase adapter
- **Payments**: Stripe
- **Email**: SendGrid (トランザクショナルメール)
- **Hosting**: Vercel

---

## 🚀 セットアップ

1.  **リポジトリをクローンします。**

    ```bash
    git clone [リポジトリのURL]
    cd [リポジトリ名]
    ```

2.  **依存関係をインストールします。**

    ```bash
    pnpm install
    ```

3.  **環境変数を設定します。**
    `.env.example` をコピーして `.env` ファイルを作成し、必要なAPIキーなどを設定してください。

    ```bash
    cp .env.example .env
    ```

4.  **開発サーバーを起動します。**
    ```bash
    pnpm dev
    ```
    ブラウザで `http://localhost:3000` を開いてください。

---

## 📚 主要なコマンド

| コマンド             | 説明                                                   |
| :------------------- | :----------------------------------------------------- |
| `pnpm dev`           | 開発サーバーを起動します。                             |
| `pnpm build`         | 本番用にビルドします。                                 |
| `pnpm start`         | ビルドしたアプリケーションを起動します。               |
| `pnpm lint`          | ESLintでコードをチェックします。                       |
| `pnpm format`        | Prettierでコードをフォーマットします。                 |
| `pnpm test`          | Vitestでユニットテストをインタラクティブに実行します。 |
| `pnpm test:run`      | Vitestでユニットテストを一度だけ実行します。           |
| `pnpm test:coverage` | テストカバレッジを計測します。                         |

---

## 🔧 HubSpotフォームの設定

このプロジェクトでは、お問い合わせフォームにHubSpotを使用しています。

### 必要な環境変数

```bash
# HubSpotポータルID（HubSpotアカウントで確認）
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=your_portal_id

# コーポレートサイト用フォームID
NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID=corporate_form_id

# メディアサイト用フォームID
NEXT_PUBLIC_HUBSPOT_MEDIA_FORM_ID=media_form_id
```

### フォームの使用箇所

- `/contact/` - コーポレートサイトのお問い合わせページ
- `/media/contact/` - メディアサイトのお問い合わせページ

---

## 📖 詳細なドキュメント

このプロジェクトのアーキテクチャ、データモデル、開発ワークフロー、AI連携のルールなどの詳細については、以下のドキュメントを参照してください。

➡️ **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**
