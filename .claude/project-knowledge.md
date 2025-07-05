# プロジェクト知見集

## アーキテクチャ決定

- **構成**: 単一のNext.jsプロジェクト。
- **ルーティング**: コーポレート(`/`)とメディア(`/media/`)でパスを分離。
- **認証・会員DB**: NextAuth.js + Firebase Adapter + Firestore。`membership`ステータスは`paid` (課金中), `free` (元有料)を管理。
- **決済**: Stripe。`/register/`ページからCheckoutフローを開始。WebhookでFirestoreを更新。
- **フォーム**: HubSpotフォームをiframeで埋め込む形式で実装する。自前のAPIエンドポイントは不要。

## microCMS データモデル設計

**型定義の方針**: TypeScriptの型は、`src/lib/schema/`配下のZodスキーマ定義から`z.infer`を用いて自動推論する。手動の型定義ファイルは作成しない。

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

## microCMS実装の技術的注意点

### セレクトフィールドの配列対応

microCMSでセレクトフィールドが「複数選択を許可」に設定されている場合、APIレスポンスは配列として返されます。この問題に対応するため、Zodスキーマで以下のような変換処理を実装しています：

```typescript
// src/lib/schema/article.schema.ts
membershipLevel: z.union([
  membershipLevelSchema, // 単一値の場合
  z.array(z.string()).transform(arr => {
    // 配列の場合は文字列パターンマッチングで値を判定
    const value = arr[0]
    if (!value) return 'public'
    
    if (value.includes('paid')) return 'paid'
    if (value.includes('public')) return 'public'
    
    return 'public'
  })
])
```

### エラーハンドリング

microCMSからのデータ取得でエラーが発生した場合、空のデータを返すようにフォールバック処理を実装しています：

```typescript
// src/lib/microcms/media-articles.ts
catch (error) {
  console.error('Failed to fetch media articles list:', error)
  
  // Zodのパースエラーの詳細を出力
  if (error instanceof z.ZodError) {
    console.error('Zod validation errors:', error.issues)
  }
  
  // エラーの場合でも空のリストを返す
  return {
    contents: [],
    totalCount: 0,
    offset: 0,
    limit: 100,
  }
}
```

## URL構造と主要ページ一覧

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
