# microCMS Integration

このディレクトリには、microCMS APIとの連携に必要なクライアント設定、型定義、バリデーションスキーマが含まれています。

## 構成

- `client.ts` - microCMSクライアントの初期化と共通設定
- `schemas.ts` - Zodを使用したバリデーションスキーマ
- `index.ts` - ライブラリのエントリーポイント
- `example.ts` - 使用例とベストプラクティス

## 使用方法

### 基本的な使い方

```typescript
import { client, mediaArticleSchema } from '@/lib/microcms'

// 記事一覧を取得
const articles = await client.get({
  endpoint: 'media_articles',
  queries: { limit: 10 }
})

// バリデーション
const validated = mediaArticleSchema.parse(articles)
```

### プレビューモード

```typescript
// プレビュー用にdraftKeyを使用
const preview = await client.get({
  endpoint: 'media_articles',
  contentId: 'xxx',
  queries: { draftKey: 'yyy' }
})
```

### 画像の最適化

```typescript
import { getOptimizedImageUrl } from '@/lib/microcms'

const optimizedUrl = getOptimizedImageUrl(imageUrl, {
  width: 800,
  format: 'webp',
  quality: 85
})
```

## 型定義

すべてのmicroCMSモデルの型定義は、Zodスキーマから自動的に推論されます。詳細は `schemas.ts` を参照してください。

主要な型：
- `MediaArticle` - メディア記事
- `Expert` - 執筆者・監修者
- `Category` - カテゴリ
- `Tag` - タグ
- `Feature` - 特集
- `CorporateNews` - コーポレートニュース
- `SiteSettings` - サイト設定（シングルトン）

## 環境変数

必須の環境変数：
- `MICROCMS_SERVICE_DOMAIN` - microCMSのサービスドメイン
- `MICROCMS_API_KEY` - APIキー

## 関連ドキュメント

- [DEVELOPMENT_GUIDE.md](/DEVELOPMENT_GUIDE.md) - プロジェクト全体の設計書
- [microCMS公式ドキュメント](https://document.microcms.io/)