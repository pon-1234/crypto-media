---

### **【統合・改訂版 v2.2】microCMS 実装設計書 兼 Claude Code 開発ガイド**
最終更新: 2025-06-30

このドキュメントは、Crypto Media & Corporate Siteプロジェクトの技術仕様を定義するとともに、AIアシスタント「Claude Code」を活用した効率的な開発ワークフローのガイドラインを定めます。

---

#### 1. MVPサマリー (2025-06-20)

| 項目                | 決定内容                                                                                                            |
| :------------------ | :------------------------------------------------------------------------------------------------------------------ |
| **公開目標**        | 2025-08-15 (β 8/1, QA 8/10)                                                                                         |
| **構成**            | 単一 Next.js アプリ＋ヘッダー 2 種（サブディレクトリ `/media/*`）                                                   |
| **ドメイン**        | `example.co.jp`                                                                                                     |
| **会員区分**        | **ゲスト** (未登録) / **無料会員** (元有料会員) / **有料会員** (課金中)                                             |
| **SSO**             | NextAuth.js（Google／Email）※LINE は Phase-2                                                                        |
| **コンテンツ**      | 月 30 本：SEO 15＋調査 15 (3-4k 字)                                                                                 |
| **ペイウォール**    | **記事単位でのアクセス制御**。有料記事は非有料会員には非表示。有料登録は`/register/`ページが起点。                  |
| **microCMS モデル** | `site_settings`, `experts`, `categories`, `tags`, `features`, `media_articles`, `pages_corporate`, `corporate_news` |
| **UI**              | Tailwind CSS／Corporate & Media ヘッダー切替                                                                        |
| **SEO/CWV 目標**    | LCP < 2s, FID < 100ms, CLS < 0.1 (Lighthouse-CI 導入、CLS対策を具体化)                                              |

---

#### 1.5 サイト構成とURL設計

本プロジェクトのサイト全体のページ構成、URL、各ページの概要は、以下のサイトマップドキュメントで定義・管理されています。
ページの追加やURLの変更など、サイト構成に関する最新情報は常に以下のドキュメントを参照してください。

- **サイトマップ原本（Googleスプレッドシート等）**: `[ここに共有リンクを貼る]`
- **管理責任者**: （例：伊藤様）
- **最終更新日**: （スプレッドシート側で管理）

本設計書は、このサイトマップに定義されたページ群を技術的に実現するための方法を記述しています。AI開発アシスタント（Claude Code）が参照するURL構造のサマリーは、`.claude/project-knowledge.md`に別途記載しています。

---

#### 2. プロジェクトの目的とユースケース

##### 2.1 プロジェクトの目的

- **SEOメディア**と**コーポレートサイト**を統合した Headless CMS 基盤を構築し、開発・運用負荷を最小化しつつ拡張性を確保する。
- **会員区分ごとの記事閲覧権限**を制御し、将来的な **LINE・CRM 連携** に耐えられるデータモデルを用意する。

##### 2.2 主要なユースケース

| アクター（役割）              | ユースケース                                                                                                                                                                           |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ゲスト (未登録ユーザー)**   | ・有料会員限定記事**以外**の記事をすべて閲覧できる。<br>・マイページにはアクセスできない。<br>・`/register/`ページや有料記事のCTAから有料会員登録フローに進むことができる。            |
| **無料会員 (元有料会員)**     | ・課金を停止した状態のユーザー。<br>・ゲストと同様、有料会員限定記事**以外**の記事をすべて閲覧できる。<br>・マイページにアクセスし、過去の情報を確認したり、再契約を行うことができる。 |
| **有料会員 (課金中ユーザー)** | ・すべての記事（有料限定含む）を全文閲覧できる。<br>・マイページにアクセスできる。                                                                                                     |
| **編集者 (Editor)**           | ・microCMSにログインし、各種コンテンツ（記事、お知らせ、執筆者情報など）の作成・編集・公開申請を行う。                                                                                 |
| **レビュー担当 (Reviewer)**   | ・microCMSにログインし、申請されたコンテンツをレビューし、公開承認または差し戻しを行う。                                                                                               |
| **管理者 (Admin)**            | ・microCMSの権限管理、APIキー管理、スキーマ編集を行う。<br>・VercelやStripeのダッシュボードを監視する。                                                                                |

---

#### 3. アーキテクチャ

##### 3.1 構成方針

- **ドメイン**: `example.co.jp`
- **Next.js プロジェクト**: 1 つ（`apps/site`）
- **ルーティング**:
  - コーポレートページ → `/`, `/about`, `/service`, …
  - メディアページ → `/media/*`
- **レイアウト切替**: **Next.js Middleware** を利用し、リクエストの `pathname` に応じてサーバーサイドで `LayoutMedia`／`LayoutCorporate` を出し分けることで、CLS（Cumulative Layout Shift）を防止する。
- **共通機能**: 会員 Cookie・Stripe・SSO はドメインルートで共有する。

##### 3.2 インフラ構成

| レイヤー            | 採用サービス (理由)                                                                                                         | 運用ポイント                                                                                                                     |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **ドメイン / DNS**  | **Cloudflare (Free)** – co.jp ドメインを NS 移管、自動 DNSSEC                                                               | _DNS only_ モードで CDN は Vercel 側を使用                                                                                       |
| **フロント配信**    | **Vercel Pro** – Next.js と相性最適、Edge CDN & ISR, SSL 自動                                                               | Project 1 つ／環境変数に microCMS・Stripe・Firebase Key を登録                                                                   |
| **CMS**             | **microCMS Pro** – Headless/SaaS                                                                                            | 複数モデル（記事、お知らせ、執筆者等）を一元管理                                                                                 |
| **認証 & 会員DB**   | **NextAuth.js + Firebase Auth/Firestore** – NextAuth.jsを認証の司令塔とし、Firebaseをバックエンド（ユーザーDB）として利用。 | NextAuth.jsのFirebase Adapterを介して`users`, `sessions`等のコレクションをFirestoreで管理。会員情報は`users`コレクションに統合。 |
| **決済**            | **Stripe** – 月額 ¥1,980 プラン                                                                                             | Webhook → Vercel Serverless `/api/stripe/webhook` (冪等チェック)                                                                 |
| **フォーム管理**    | **HubSpot** – お問い合わせフォームはiframeで埋め込み                                                                        | APIエンドポイントは不要                                                                                                          |
| **メール送信**      | **SendGrid** – パスワードリセット等のトランザクショナルメール用                                                             | APIキーを環境変数で管理                                                                                                          |
| **画像 / OGP**      | microCMS Image API (`?fm=webp&w=`) + Vercel OG Image                                                                        | OGP 自動生成関数 `/api/og`                                                                                                       |
| **CI/CD**           | GitHub Push → Vercel Auto Deploy                                                                                            | **Lighthouse-CI**と**Slug重複チェック**をGitHub Actionsに組込。                                                                  |
| **監視 & アラート** | Vercel Slack Integration, Stripe Dashboard Alerts                                                                           | 5xx / Webhook Fail を #deploy-notify へ通知                                                                                      |

##### 3.3 主要APIエンドポイント

| エンドポイント        | 役割                                                                              | 呼び出し元 → 呼び出し先           |
| :-------------------- | :-------------------------------------------------------------------------------- | :-------------------------------- |
| `/api/stripe/webhook` | Stripeからの決済イベント（完了・失敗・解約等）を受信し、Firestoreの会員情報を更新 | Stripe → Vercel                   |
| `/api/stripe/portal`  | 認証済みユーザー向けのStripe顧客ポータルセッションを作成し、リダイレクト          | Next.js Client → Vercel → Stripe  |
| `/api/og`             | 記事タイトル等から動的にOGP画像を生成                                             | Twitter/Facebookクローラ → Vercel |

---

#### 4. microCMS サービス設定

| 項目           | 値                                           |
| :------------- | :------------------------------------------- |
| サービス名     | `crypto-media`                               |
| ワークスペース | `lasa-group` （仮）                          |
| デフォルト言語 | `ja` （必要に応じて `en` 追加）              |
| API 形式       | REST / GraphQL（β）両対応 ※REST をメイン想定 |

##### 4.1 権限ロール

| ロール        | 権限範囲                    | 想定ユーザ             |
| :------------ | :-------------------------- | :--------------------- |
| **Admin**     | 全権                        | PM, TechLead           |
| **Editor**    | コンテンツ CRUD, プレビュー | ライター, マーケチーム |
| **Reviewer**  | 読取＋公開可否              | SEO チェック担当       |
| **Developer** | スキーマ編集, APIKey 管理   | 開発チーム             |

---

#### 5. コンテンツモデル

| Model ID                       | 説明                                   | 主キー    | 参照先                                      |
| :----------------------------- | :------------------------------------- | :-------- | :------------------------------------------ |
| `site_settings`                | メタタグ・OGP・GA 等グローバル設定     | singleton | -                                           |
| **`corporate_news`**           | **コーポレートサイト用のお知らせ**     | `id`      | `corporate_news_categories`                 |
| **`corporate_news_categories`** | **コーポレートニュースのカテゴリ**     | `id`      | -                                           |
| **`experts`**                  | **執筆者・監修者プロファイル**         | `id`      | -                                           |
| `categories`                   | メディア記事カテゴリ                   | `id`      | -                                           |
| `tags`                         | メディア記事タグ（多対多）             | `id`      | -                                           |
| **`features`**                 | **特集記事（複数の記事をまとめる）**   | `id`      | -                                           |
| `media_articles`               | **メディアサイトの記事・お知らせ等**   | `id`      | `experts`, `categories`, `tags`, `features` |
| `pages_corporate`              | コーポレート固定ページ                 | `id`      | -                                           |

> **モデル設計方針**
>
> - **型定義**: 本プロジェクトでは、microCMSのコンテンツモデルに対応するTypeScriptの型を、`src/lib/schema/`配下のZodスキーマから自動的に推論します。これにより、型とバリデーションロジックの整合性を常に保証します。
> - **モデルの分離と集約**: コーポレートのお知らせ(`corporate_news`)とメディアの記事群(`media_articles`)は扱う内容が異なるため分離する。執筆者と監修者は`experts`モデルに統合する。
> - **標準機能の活用**: microCMS標準の「公開／下書き」ステータス、および**公開日時(`publishedAt`)**を正として運用する。これらの情報を管理するための独立したフィールドは設けない。

##### 5.1 `corporate_news` (修正版)

コーポレートサイト(`/news/`)に表示される、企業活動に関するお知らせ。

| フィールドID | 型                     | 説明                                                |
| :----------- | :--------------------- | :-------------------------------------------------- |
| `title`      | Text                   | お知らせのタイトル                                  |
| `content`    | RichText               | お知らせの本文                                      |
| `category`   | Reference (Single)     | ニュースカテゴリ (`corporate_news_categories`参照) |

##### 5.2 `experts` (旧`authors`モデルから変更)

執筆者と監修者を一元管理する。サイトマップの`/media/experts/`に対応。

| フィールドID | 型                    | 説明                                       |
| :----------- | :-------------------- | :----------------------------------------- |
| `name`       | Text                  | 氏名                                       |
| `slug`       | Text                  | `/experts/[slug]` 用のURLスラッグ          |
| `role`       | **Select (Multiple)** | **「執筆者」「監修者」**の役割を選択できる |
| `profile`    | RichText              | プロフィール、経歴                         |
| `avatar`     | Image                 | 顔写真                                     |

##### 5.3 `features` (新規モデル)

複数の記事をまとめる特集記事（`/media/feature/`）を管理する。

| フィールドID  | 型       | 説明                                       |
| :------------ | :------- | :----------------------------------------- |
| `name`        | Text     | 特集名（例：「2025年の暗号資産トレンド」） |
| `slug`        | Text     | `/media/feature/[slug]` 用のURLスラッグ    |
| `description` | TextArea | 特集の概要説明                             |
| `heroImage`   | Image    | 特集ページのメイン画像                     |

##### 5.4 `media_articles` (修正版)

メディアサイトのすべての記事コンテンツ（通常記事、調査レポート、メディアお知らせ）を管理する。

| フィールドID      | 型                       | 必須 | 説明                                                                                      |
| :---------------- | :----------------------- | :--- | :---------------------------------------------------------------------------------------- |
| `title`           | Text                     | ✓    | 記事タイトル                                                                              |
| `slug`            | Text                     | ✓    | `/media/articles/[slug]` 等のURLスラッグ                                                  |
| `type`            | Select                   | ✓    | **`article` (通常記事), `survey_report` (調査レポート), `media_news` (メディアお知らせ)** |
| `membershipLevel` | Select                   | ✓    | `public` (全員公開), `paid` (有料会員限定)                                                |
| `content`         | RichText                 | ✓    | 本文                                                                                      |
| `heroImage`       | Image                    | ✓    | OGP 兼用                                                                                  |
| `category`        | **Reference (Single)**   | -    | **カテゴリ（単一選択）**                                                                  |
| `tags`            | Reference (Multiple)     | -    | タグ（複数選択）                                                                          |
| `author`          | Reference (Single)       | -    | 主な執筆者 (`experts`モデルを参照)                                                        |
| `supervisor`      | Reference (Single)       | -    | 主な監修者 (`experts`モデルを参照)                                                        |
| `features`        | **Reference (Multiple)** | -    | **この記事が属する特集 (`features`モデルを参照)**                                         |

##### 5.5 `corporate_news_categories` (新規モデル)

コーポレートニュースのカテゴリを管理する。

| フィールドID | 型   | 説明                                          |
| :----------- | :--- | :-------------------------------------------- |
| `name`       | Text | カテゴリ名（例：「プレスリリース」「IR情報」） |
| `slug`       | Text | `/news/category/[slug]` 用のURLスラッグ       |

---

#### 6. 有料会員（Paywall）仕様

##### 6.1 スキーマ拡張

`media_articles` に以下のフィールドを追加します。

| フィールドID         | 型       | 必須 | 説明                                                                                                 |
| :------------------- | :------- | :--- | :--------------------------------------------------------------------------------------------------- |
| **`previewContent`** | RichText | -    | **有料記事 (`paid`) の場合**に、非会員に表示するティーザーコンテンツ。空の場合は定型の案内文を表示。 |
| **`paywallCTA`**     | Text     | -    | ログイン／会員登録CTAの文言。空の場合はデフォルト文言。                                              |

##### 6.2 フロント表示ロジック（記事単位のアクセス制御）

1.  ユーザーが記事ページにアクセスする。
2.  まず記事の `membershipLevel` を取得する。
3.  **もし `membershipLevel` が `public` ならば：**
    - ユーザーのログイン状態に関わらず、記事の全文を表示する。
4.  **もし `membershipLevel` が `paid` ならば：**
    - ユーザーの認証状態とFirestore上の会員ステータスを確認する。
    - **ユーザーが有料会員（課金中）の場合**：記事の全文を表示する。
    - **ユーザーが有料会員でない場合（ゲスト、無料会員を含む）**：記事本文の代わりに、`previewContent` または定型の案内文（「この記事は有料会員限定です」等）と、ログイン／有料会員登録への導線（CTA）を表示する。

##### 6.3 SEO / クロール方針

Google の「柔軟なサンプリング」ガイドラインに準拠し、**JSON-LD形式の構造化データ**を実装して有料コンテンツであることを明示します。

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "isAccessibleForFree": "False",
  "hasPart": {
    "@type": "WebPageElement",
    "isAccessibleForFree": "False",
    "cssSelector": ".paid-content" // ペイウォールで隠される部分を囲むCSSセレクタ
  }
}
```

##### 6.4 Stripe 決済フロー

| フロー                         | 処理                                                                       | 成功時                                                    | 失敗時／解約時                                         |
| :----------------------------- | :------------------------------------------------------------------------- | :-------------------------------------------------------- | :----------------------------------------------------- |
| **① Checkout**                 | `/register/`等のページから`stripe.redirectToCheckout`                      | セッション ID 取得                                        | エラーページ                                           |
| **② Webhook**                  | `checkout.session.completed`                                               | **Firestore**の `members` テーブル `membership=paid` 更新 | -                                                      |
| **③ Portal**                   | `/api/stripe/portal` で購読管理                                            | Stripe Portal へ遷移                                      | -                                                      |
| **④ Webhook (renewal/cancel)** | `invoice.payment_succeeded` / `...failed`, `customer.subscription.deleted` | Firestore上の有効期限更新                                 | Firestoreの `membership` を `free` (元有料会員) に更新 |

---

#### 7. 非機能要件

| 項目               | 要件・方針                                                                                                                                                                                                                           |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **パフォーマンス** | ・Core Web Vitals目標値を `LCP < 2.0s`, `FID < 100ms`, `CLS < 0.1` とする。<br>・Lighthouse-CIを導入し、Pull Requestごとにスコアをチェックする。<br>・画像はmicroCMS Image APIでWebP形式に変換し、最適化する。                       |
| **セキュリティ**   | ・会員情報はFirestoreに一元化し、microCMSには一切保持しない。<br>・Stripe Webhookのエンドポイントでは署名検証と冪等性チェックを必須とする。                                                                                          |
| **可用性**         | ・フロントエンド、CMS、認証DBは、Vercel, microCMS, FirebaseのSLAに準拠する。<br>・VercelのSlack連携により、5xxエラーやデプロイ失敗を即時検知する。<br>・StripeのWebhook失敗時はSlack通知を行い、手動での再実行または顧客対応を行う。 |
| **保守性**         | ・運用負荷を低減するため、責務に応じてモデルを適切に分離・統合する。<br>・CI/CDパイプラインにより、デプロイと品質チェックを自動化する。<br>・コードベースは単一リポジトリ（モノレポ）で管理し、依存関係の整合性を保つ。              |

---

#### 8. 開発ワークフローとClaude Code活用

本プロジェクトでは、開発効率を最大化するためにAIアシスタント「Claude Code」を全面的に活用します。開発者は以下のワークフローに従ってください。

#### ★ AI連携の基本方針: "Gemini collects, Claude crafts."

本プロジェクトでは、Claude Codeを**司令塔・実装担当**とし、必要に応じてGoogle Gemini CLIを**調査・分析担当**として連携させるワークフローを推奨します。

- **Gemini (調査・分析)**: Web検索による最新情報の収集、大規模なコードベースの横断的な分析を担当します。
- **Claude (設計・実装)**: Geminiから得た情報を元に、ロジックを組み立て、設計・コーディングを行います。

##### 8.1 初期セットアップ

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定 (Firebase, Stripe, microCMSのキーを設定)
cp .env.example .env

# フォーマット修正 (Prettierの実行)
pnpm format

# Claude Codeの初期化 (プロジェクトのコンテキストをAIに読み込ませる)
claude /init
```

##### 8.2 Claude Codeを活用した開発サイクル (★更新)

1.  **機能実装とテスト生成の依頼**:
    具体的な要件と参照すべき設計書を指示し、コードとテストの同時生成を依頼します。

    ```bash
    claude Implement the 'Paywall' component based on issue #123 and '.claude/project-knowledge.md'. Generate a unit test file as well.
    ```

2.  **テストの実行とパス**:
    生成されたコードに対してテストを実行し、パスすることを確認させます。

    ```bash
    claude Run 'pnpm test' for the newly created 'Paywall.test.tsx'. Fix any errors to ensure all tests pass.
    ```

3.  **GeminiによるAIコードレビュー (★新規ステップ)**:
    テストがパスしたコードに対して、Geminiによるコードレビューを実施させます。これにより、テストだけでは見つけられない可読性やベストプラクティスからの逸脱、潜在的な問題を洗い出します。

    ```bash
    claude /task gemini-analyze -p "@src/components/media/Paywall.tsx をレビューしてください。特に、可読性、パフォーマンス、DEVELOPMENT_GUIDE.mdで定義された規約への準拠を確認してください。"
    ```

4.  **レビューフィードバックの反映**:
    GeminiからのフィードバックをClaudeに渡し、コードを修正させます。

    ```bash
    claude Gemini's review found potential N+1 problem. Please fix this.
    ```

5.  **リファクタリングと最終確認**:
    既存のコードを改善する場合も、Claude Codeに規約を遵守させます。
    `bash
    # 例: 既存コンポーネントのリファクタリング依頼
    claude refactor the 'ArticleCard.tsx' component.
    Ensure it adheres to the coding conventions in 'CLAUDE.md',
    especially regarding JSDoc comments and linking to related issues.
    `
    > **Note:** AIレビューサイクルでAI間の意見が対立した場合や、修正がループしそうな場合は、AIに最終判断を委ねず、開発者が介入して方針を決定してください。AIはあくまで強力なアシスタントであり、最終的な意思決定者は開発者です。

##### 8.3 知見の更新 (重要)

新しい技術的決定、重要なデバッグの記録、改善の教訓などが得られた場合は、**必ず知見ファイルを更新**します。これにより、AIが常に最新のプロジェクト状況を学習し、提案の精度が向上します。

```bash
# カスタムコマンドで知見更新をAIに依頼
claude /learnings

# AIへの指示例:
# We decided to use 'date-fns' for all date formatting instead of 'moment.js' for bundle size reduction.
# Please update '.claude/project-knowledge.md' to reflect this decision.
```

##### 8.4 高度な活用: Gemini-CLIとの連携

開発者は、必要に応じてClaudeに指示し、あるいはClaude自身の判断で、Geminiを呼び出す連携フローを活用できます。

- **自動連携フロー（Claude主導）**:
  大規模なリファクタリングや調査が必要な場合、Claudeは自己判断でGeminiをバックグラウンドで呼び出し、その結果を要約して開発者に提案します。開発者はAIにタスクを委任するだけで、最適な結果を得られます。

- **手動連携フロー（開発者主導）**:
  開発者が`/task gemini-search "..."`や`/task gemini-analyze "..."`といったコマンドを直接実行し、特定の情報収集やコードレビューをAIに依頼するフローです。これにより、「調査→実装→レビュー」のサイクルを高速に回すことができます。

この連携を実現するための具体的な設定は、後述の「Claude Code用 設定ファイル群」および`CLAUDE.md`に記載されています。

---

#### 9. CI/CD, テスト, 品質保証

##### 9.1 CI/CD パイプライン

1.  **自動デプロイ**: `main`ブランチへのマージをトリガーに、Vercelが自動で本番環境にデプロイする。
2.  **品質ゲート**: Pull Request作成時に、GitHub Actionsで以下のCIを実行する。
    - **Lighthouse-CI**: LCP, FID, CLSのスコアが閾値を下回らないかチェック。
    - **Slug重複チェック**: 全記事の`slug`を取得し、重複がないか検証。重複した場合はビルドを失敗させる。
    - **静的解析・フォーマット**: ESLint/Prettierによるコード規約チェック。
3.  **通知**: デプロイやCIの成否をSlackの`#deploy-notify`チャンネルに通知する。

##### 9.2 テスト戦略（更新）

| テスト種別                 | ツール                   | 対象とClaude活用方針                                                                                                                                                                                                                    |
| :------------------------- | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **単体テスト (Unit Test)** | **Vitest / RTL**         | ・ペイウォール表示ロジックなどのユーティリティ関数。<br>・主要なUIコンポーネントのPropsに応じた表示。<br>・**コードカバレッジ 100 % 必達** (`vitest run --coverage`)。<br>➡️ **Claudeに機能実装と同時にテストコード生成を義務付ける。** |
| **E2Eテスト (End-to-End)** | **Playwright** (Phase‑2) | ・有料会員登録 → ログイン → 有料記事閲覧の主要フロー。<br>・Stripe Checkoutへの遷移。<br>➡️ **Claudeに主要なユーザーストーリーを伝え、Playwrightのテストスクリプトを生成させる。**                                                      |

##### 9.3 品質保証 (QA)

- **プレビュー環境**: microCMSの「プレビュー」ボタンから、`previewKey`付きでプレビュー用ページに遷移し、公開前のコンテンツ確認を行う。
- **ISR (Incremental Static Regeneration)**: VercelのISR (`revalidate: 60`) を利用し、公開後のコンテンツも定期的に再生成する。

##### 9.4 完了条件 ★

次の 3 項目は **`CLAUDE.md` にも転記し、Pull Request の Done 定義** とする。

1. `pnpm lint`, `pnpm format --check`, `pnpm typecheck`, `pnpm build`, `pnpm playwright test` が **すべて成功**すること
2. `vitest run --coverage` で行・分岐 **100 % のカバレッジ** を達成すること
3. 追加・変更に伴う **関連ドキュメントの更新が完了**していること

**重要**: CIパイプラインでは、Prettierのフォーマットチェックを厳格に実施します。プルリクエスト前に必ず `pnpm format` を実行し、フォーマットを修正してからコミットしてください。

---

#### 10. 未決事項と今後の課題

| 項目                              | 内容・方針                                                                                                                          |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **LINE連携 (Phase-2)**            | ・Phase-2での実装を予定。<br>・NextAuth.jsのLINEプロバイダー追加と、Firestoreの`members`コレクションにLINE IDを紐付ける設計を想定。 |
| **E2Eテストの本格導入 (Phase-2)** | ・リリース後の安定運用フェーズで、PlaywrightによるE2EテストをCIに本格導入することを検討する。                                       |
| +                                 | **LPの実装 (Phase-2)**                                                                                                              | ・ビジネスモデルの確定がボトルネックとなるため、`/media/lp/[slug]`として実装予定のLPはPhase-2のスコープとする。 |
| **ワークスペース名**              | ・microCMSのワークスペース名 `lasa-group` は仮のため、正式名称を決定する必要がある。                                                |

---

#### 11. コードコメント規約 & 禁止事項 ★（新設）

##### 11.1 主要クラスの Javadoc コメント要件

すべての主要クラス／サービス層クラスの冒頭には、下記 3 点を Javadoc 形式 (/\*_ … _/) で必須記載とする。
Claude Code で自動生成する際も同様。

| ラベル   | 記載内容                             | 例                                                       |
| :------- | :----------------------------------- | :------------------------------------------------------- |
| @doc     | 当該実装の設計ドキュメント URL       | @doc https://example.co.jp/docs/paywall-spec             |
| @related | 関連クラス名と用途メモ               | @related FirestoreMembershipService - 会員ステータス取得 |
| @issue   | 既知バグ／課題をまとめたチケット URL | @issue https://github.com/org/repo/issues/456            |

##### 11.2 絶対禁止事項

1. テスト・型エラー解消のための条件緩和／仕様変更
2. テストのスキップ、不適切なモックによるごまかし
3. 出力やレスポンスのハードコード
4. エラーメッセージの無視・隠蔽
5. 一時しのぎの修正で問題を先送りすること
6. **`any`型の安易な使用**: TypeScriptの型安全性を維持するため、`any`型の使用は原則禁止とする。型が不明な場合は`unknown`型と型ガードを使用すること。やむを得ず使用する場合は、その理由をコメントで明記し、レビューで承認を得ること。

違反が検知された場合、そのコミットは CI で自動 Reject される。

---

---

### Claude Code用 設定ファイル群

上記の統合設計書に基づき、Claude Codeがプロジェクトを理解するために必要な設定ファイル群です。これらのファイルをプロジェクトのルートディレクトリに配置してご利用ください。

#### 1. `CLAUDE.md` (メイン設定ファイル)

```markdown
# プロジェクト概要: Crypto Media & Corporate Site

このプロジェクトは、SEOメディアとコーポレートサイトを統合したHeadless CMS基盤です。Next.js, microCMS, Firebase, Stripeを主要技術スタックとして使用しています。

## 会員区分と閲覧権限

- **ゲスト (未登録)**: 有料記事以外は全文閲覧可能。
- **無料会員 (元有料会員)**: ゲストと同じ閲覧権限。マイページにアクセス可能。
- **有料会員 (課金中)**: 全記事を閲覧可能。有料登録は`/register/`ページが起点。
- **注意**: 新規の無料会員登録フローはありません。

## 知見管理システム

このプロジェクトでは、以下のファイルで知見を体系的に管理しています。何かを実装・決定する際は、これらのファイルを必ず参照してください。

- **`.claude/context.md`**: プロジェクトの背景、目的、ビジネス要件。
- **`.claude/project-knowledge.md`**: アーキテクチャ、技術選定、実装パターン。

新しい実装や重要な決定を行った際は、`/learnings`コマンドで該当ファイルを更新してください。

## AI Collaboration Policy: Claude & Gemini ★

### Guiding Principle

**"Gemini collects, Claude crafts."**
あなたは "司令塔" (計画・実装担当) です。Geminiはあなたの "目" (大規模分析・調査担当) です。あなた自身のコンテキストの限界を超えるために、分析や調査タスクはGeminiに委任してください。

### Automatic Gemini Invocation

以下の条件に合致する場合、あなたは **自己判断で** `/task` 経由でGemini CLIを呼び出す **必要があります**。すべての呼び出しには非対話モード (`-p`) を使用してください。

**`gemini-analyze` のトリガー:**

- ユーザーの要求が **3つ以上のディレクトリ、または非常に大きなファイル** の分析を必要とする場合。
- ユーザーがコードベースに対して **「レビュー」「分析」「要約」「プロジェクト全体から探して」** といった単語を明示的に使用した場合。
- 必要なコンテキストが **50kトークン** を超えると見積もられる場合。

**`gemini-search` のトリガー:**

- ユーザーがあなたの学習データにない可能性のある **新しいライブラリ、API、特定の技術コンセプト** について尋ねた場合。
- ユーザーの要求が **最新の情報** を必要とする場合（例：「〜の最新バージョン」）。

**呼び出し後の応答方法:**

- **Geminiの生の出力を貼り付けないでください。**
- あなたの主な責務は、Geminiの発見を **要約** し、全体の目標と統合し、簡潔な計画や結果を私に提示することです。

**あなたの思考プロセス例:**

1.  ユーザー: 「新しい認証モジュールのセキュリティ脆弱性をレビューして」
2.  私の思考: 「了解。これはモジュール全体に対するレビュータスクだ。`gemini-analyze`の実行条件に合致するな。」
3.  私の行動 (バックグラウンドで実行): `/task gemini-analyze -p "@src/auth/ 一般的なセキュリティ脆弱性（XSS、CSRFなど）をチェックして。"`
4.  私からユーザーへの応答: 「承知しました。現在、Geminiを使用して認証モジュールの詳細なセキュリティ分析を実行しています。潜在的な問題点の要約と修正案を追って報告します。」

## 技術スタック

- **フレームワーク**: Next.js (App Router)
- **UI**: React, Tailwind CSS
- **言語**: TypeScript
- **CMS**: microCMS
- **認証 & 会員DB**: Firebase Authentication, Firestore
- **決済**: Stripe
- **インフラ**: Vercel, Cloudflare
- **テスト**: Vitest, React Testing Library, **Gemini CLI (コード分析・レビュー用)**
- **パッケージ管理**: pnpm
- **チケット管理**: GitHub Issues

## microCMS モデル概要

- **`corporate_news`**: コーポレートサイト用のお知らせ。
- **`media_articles`**: メディアの全記事・お知らせ。`type`で通常記事/調査レポート/メディアお知らせを区別。
- **`experts`**: 執筆者と監修者を管理。`role`フィールドで役割を区別。
- **`features`**: 複数の記事をまとめる特集ページ。
- **`categories`, `tags`**: メディア記事の分類用。

## 開発ワークフロー

- **セットアップ**: `pnpm install`
- **開発サーバー**: `pnpm dev`
- **テスト**: `pnpm test` (常に`watch`モード)、`pnpm test:run` (単発実行)
- **Linter/Formatter**: `pnpm lint`, `pnpm format`
- **タスク管理**: すべての機能開発・バグ修正はGitHub Issueを起点とします。

## コード生成規約

- **言語**: TypeScriptを厳格に使用してください。`any`型は原則禁止です。
- **コンポーネント**: Reactの関数コンポーネントで作成してください。

- **コメントと関連Issue**:
  - すべての主要なコンポーネントや複雑なロジックを持つ関数の冒頭には、その目的を説明するJSDocコメントを日本語で必ず追加してください。
  - **加えて、コードが関連するGitHub Issueがある場合は、以下の形式で必ずリンクを記載してください。これにより、コードの背景にある文脈が明確になります。**
    - `@see [ドキュメント名] (URL)`: 関連する設計書やFigmaへのリンク。
    - `@issue #Issue番号 - Issueのタイトル`: このコードが実装または修正したGitHub Issue。
  - **主要クラスの場合はさらに次を必須追加します。**
    - `@doc <設計ドキュメントURL>`
    - `@related <関連クラス名> - <用途メモ>`
    - `@issue <既知バグのトラッキングURL>`

- **テスト**: 新しい機能やコンポーネントを追加する際は、必ず **Vitest** とReact Testing Libraryを使用したユニットテストファイル (`*.test.tsx`) も同時に生成してください。実装完了後は`pnpm vitest run --coverage`を実行し、**カバレッジ100 %** を確認してください。

- **スタイル**: Tailwind CSSをユーティリティファーストで使用してください。カスタムCSSは最小限に留めます。

- **規約**: ハードコードは絶対にしないでください。APIキーや固定文字列などの設定値は、環境変数や`src/config/`以下の設定ファイルで管理します。

- **参照**: 実装パターンについては`.claude/project-knowledge.md`の決定事項に必ず従ってください。特に「会員情報はFirestoreに一元管理」「ペイウォールは記事単位のアクセス制御」という点は重要です。

## 禁止事項

1. テストや型エラー解決を目的とした仕様の無断緩和
2. テストスキップや不当なモックでカバー率を偽装する行為
3. ハードコードによる一時対応（APIキー・固定レスポンス等）
4. エラーハンドリングの省略・隠蔽
5. 修正を先送りする「TODO で残すだけ」のコミット

## 完了条件（Definition of Done）

- `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` が成功すること
- `pnpm vitest run --coverage` で **Statements / Branches / Functions / Lines = 100 %**
- `pnpm playwright test` がグリーンであること
- 変更に伴い、本ドキュメントおよび `.claude/` 配下ドキュメントが更新済みであること
```

#### 2. `.claude/context.md` (プロジェクトの背景・制約)

```markdown
# プロジェクトコンテキスト

## 目的

- SEOメディアとコーポレートサイトを統合したHeadless CMS基盤を構築し、開発・運用負荷を最小化する。
- 会員区分に応じた記事の閲覧権限を制御するデータモデルを設計する。

## 主要なユースケース

- **ゲスト (未登録ユーザー)**: 有料会員限定記事以外の記事をすべて閲覧できる。マイページにはアクセスできない。`/register/`ページから有料登録フローに進むことができる。
- **無料会員 (元有料会員)**: 課金を停止した状態のユーザー。有料会員限定記事以外の記事をすべて閲覧できる。マイページにアクセスし、再契約などが可能。
- **有料会員 (課金中ユーザー)**: すべての記事（有料限定含む）を全文閲覧できる。マイページにアクセスできる。

## 制約・非機能要件

- **パフォーマンス (CWV)**: LCP < 2.0s, FID < 100ms, CLS < 0.1 を達成する。Lighthouse-CIでPRごとにチェックする。
- **セキュリティ**: 会員情報はFirestoreに一元化し、microCMSには保持しない。Stripe Webhookでは署名検証と冪等性チェック必須。
- **可用性**: Vercel, microCMS, FirebaseのSLAに準拠し、エラーはSlackに即時通知する。
- **保守性**: 責務に応じてモデルを適切に分離・統合し、CI/CDで品質チェックを自動化する。
```

#### 3. `.claude/project-knowledge.md` (技術的知見・決定事項)

```markdown
# プロジェクト知見集

## アーキテクチャ決定

- **構成**: 単一のNext.jsプロジェクト。
- **ルーティング**: コーポレート(`/`)とメディア(`/media/`)でパスを分離。
- **認証・会員DB**: Firebase Auth + Firestore。`membership`ステータスは`paid` (課金中), `free` (元有料)を管理。
- **決済**: Stripe。`/register/`ページからCheckoutフローを開始。WebhookでFirestoreを更新。
- **フォーム**: MVPでは実装方法未定。`/api/contact`エンドポイントを用意し、バックエンドで処理。

## microCMS データモデル設計

- **`corporate_news` vs `media_articles`**: コーポレート用とメディア用のお知らせは、扱う内容が異なるため、それぞれ別のモデルで管理する。
- **`experts`**: 執筆者と監修者は`experts`モデルに統合。`role`フィールド（複数選択可）で役割（"執筆者", "監修者"）を管理する。
- **`media_articles`内の分類**:
  - `type` (Select): `article` (通常記事), `survey_report` (調査レポート), `media_news` (メディアお知らせ)を管理。
  - `category` (Single-Reference): 記事の主カテゴリを1つだけ紐づける。
  - `tags` (Multi-Reference): 関連タグを複数紐づける。
  - `features` (Multi-Reference): 記事が属する特集を複数紐づける。

## 実装パターン

- **ペイウォール (記事単位のアクセス制御)**: 記事の`membershipLevel`が`paid`の場合、Firestoreのユーザーの`membership`ステータスをチェックしてアクセスを制御する。
- **状態管理**: シンプルな用途ではReact Context APIを使用。複雑化する場合はZustandを検討。
- **データフェッチ**: SWRまたはReact Query (TanStack Query) を使用し、キャッシュ戦略を統一する。

## URL構造と主要ページ一覧 (★新規セクション)

本プロジェクトの主要なURL構造は以下の通りです。詳細なサイトマップの原本は[こちら](ここにスプレッドシートへのリンクを貼る)。

### コーポレートサイト (`/`)

- `/`: トップページ
- `/about/`: 会社概要
- `/service/`: 事業内容
- `/recruit/`: 採用情報
- `/news/`: コーポレートからのお知らせ一覧
- `/news/category/[slug]`: お知らせカテゴリ別一覧
- `/news/category/[slug]/[id]`: お知らせ詳細
- `/contact/`: お問い合わせフォーム
- `/terms/`: 利用規約
- `/privacy-policy/`: 個人情報保護方針
- `/dealing/`: 特定商取引法に基づく表記

### メディアサイト (`/media/`)

- `/media/`: メディアトップ
- `/media/articles/`: 記事一覧（全件）
- `/media/articles/[slug]`: 記事詳細
- `/media/category/`: カテゴリ一覧
- `/media/category/[slug]`: カテゴリ別記事一覧
- `/media/tag/`: タグ一覧
- `/media/tag/[slug]`: タグ別記事一覧
- `/media/experts/`: 執筆者・監修者一覧
- `/media/experts/[slug]`: 執筆者・監修者詳細
- `/media/feature/`: 特集一覧
- `/media/feature/[slug]`: 特集詳細（記事一覧）
- `/media/news/`: メディアからのお知らせ一覧
- `/media/news/[slug]`: メディアお知らせ詳細
- `/media/premium/`: 有料限定記事一覧
- `/media/survey/`: 調査レポート一覧
- `/media/glossary/`: 用語集
- `/media/faq/`: FAQ
- `/media/editorial-policy/`: 編集方針
- `/media/contact/`: お問い合わせフォーム

### 認証・会員関連ページ

- `/register/`: 有料会員登録ページ（Stripeへの導線）
- `/login/`: ログインページ
- `/media/mypage/`: 会員マイページ
- `/media/mypage/membership/`: 会員ステータス・課金管理
- `/media/mypage/settings/`: プロフィール設定
- `/media/mypage/support/`: サポートページ
```

#### 4. `.claude/settings.local.json` (コマンド実行許可設定)

プロジェクトのルートに `.claude` ディレクトリを作成し、その中にこのファイルを配置してください。

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm:*)",
      "Bash(npx:*)",
      "Bash(ls:*)",
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(cat:*)",
      "Bash(mkdir:*)",
      "Bash(touch:*)",
      "Bash(mv:*)",
      "Bash(cp:*)",
      "Bash(rm:*)"
    ],
    "deny": ["Bash(git:*)"]
  }
}
```

#### 5. `gemini-*.md` (Gemini連携用ツール定義)

Geminiとの連携を有効にするため、`.claude/commands/` ディレクトリに以下の2つのツール定義ファイルを作成してください。

##### `gemini-analyze.md`

````markdown
## Gemini Code Analyzer

Use Gemini CLI to analyze large local codebases.
**Note: This tool can be run automatically by Claude in non-interactive mode using the `-p` flag.**

```bash
gemini -p "@path/to/file or directory <Your analysis prompt>"
```
````

##### `gemini-search.md`

````markdown
## Gemini Web Search

Use Gemini CLI to perform Google web searches for the latest information.

```bash
gemini -p "WebSearch: <your query here>"
```
````
