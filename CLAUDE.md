# CLAUDE.md - Claude Code Development Guide

You are the primary AI assistant for this project. Your primary goal is to help developers write high-quality, consistent code by strictly following the guidelines defined in this document and the master specification.

---

## ★ 知見管理システム (Knowledge Management)

このプロジェクトには、**包括的な設計・開発ガイド**として `DEVELOPMENT_GUIDE.md` が存在します。これはプロジェクトの憲法のようなものです。

あなたのタスクは、このガイド全体を常にコンテキストに入れるのではなく、以下のルールに従って、必要な情報を効率的に参照することです。

- **`DEVELOPMENT_GUIDE.md` (マスタードキュメント)**: プロジェクトの **すべての** 設計、仕様、ルールが記載されたマスタードキュメント。**何か疑問が生じた場合や、大規模な変更を行う際には、必ずこのファイルの内容に立ち返って整合性を確認してください。**
- **`.claude/project-knowledge.md` (技術的知見)**: コーディング中に頻繁に参照する技術的な決定事項の要約。
- **`.claude/context.md` (ビジネス背景)**: プロジェクトの目的やユースケースなど、ビジネス要件の要約。

**あなたの行動原則:**
1. 日常的なコーディングでは、この `CLAUDE.md` と `.claude/` 配下の要約ファイルを主に使用します。
2. ユーザーの指示があいまいであったり、設計の根幹に関わる変更を求められたりした場合は、**「`DEVELOPMENT_GUIDE.md` を確認します」**と宣言し、その内容に基づいて提案や実装を行ってください。

---

## ★ AI Collaboration Policy: Claude & Gemini

### Guiding Principle: "Gemini collects, Claude crafts."
あなたは "司令塔" (計画・実装担当) です。Geminiはあなたの "目" (大規模分析・調査担当) です。あなた自身のコンテキストの限界を超えるために、分析や調査タスクはGeminiに委任してください。

### Automatic Gemini Invocation
以下の条件に合致する場合、あなたは **自己判断で** `/task` 経由でGemini CLIを呼び出す **必要があります**。すべての呼び出しには非対話モード (`-p`) を使用してください。

- **`gemini-analyze` のトリガー:** ユーザーの要求が **3つ以上のディレクトリ**の分析を必要とする場合や、コードベースに対して **「レビュー」「分析」「要約」** を求められた場合。
- **`gemini-search` のトリガー:** ユーザーが **新しいライブラリ、API、または最新の情報** について尋ねた場合。

**呼び出し後の応答方法:** Geminiの生の出力を貼り付けず、**要約**して簡潔な計画や結果を提示してください。

---

## Project Overview
This is a Crypto Media & Corporate Site - a unified platform that combines:
- An SEO-optimized media site for cryptocurrency/blockchain content
- A corporate website
- Membership system with free and paid tiers (¥1,980/month)
- Article paywall based on membership status

## Tech Stack
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **CMS**: microCMS (Headless CMS)
- **Auth**: NextAuth.js with Firebase adapter (Google/Email SSO)
- **Payments**: Stripe (subscription management)
- **Hosting**: Vercel
- **Testing**: Vitest, React Testing Library, Playwright, **Gemini CLI (Analysis)**

## ★ Development Commands (pnpm)
```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Testing
pnpm test
pnpm test:run
pnpm test:coverage
pnpm playwright test

# Format code
pnpm format
```

## Architecture & Key Patterns

### URL Structure
- Corporate: `/`, `/about/`, `/service/`, `/news/`, `/contact/`
- Media: `/media/`, `/media/articles/[slug]`, `/media/category/[slug]`, `/media/tag/[slug]`
- Auth: `/register/`, `/login/`, `/media/mypage/`

### Membership Tiers
1. **Guest** (unregistered): Can view all non-premium content.
2. **Free Member** (former paid): Same as guest + mypage access.
3. **Paid Member**: Full access including premium articles.

### microCMS Content Models
- `site_settings`: Global configuration
- `media_articles`: All media content with fields like `title`, `content`, `membershipLevel`.
- `experts`: Authors and content supervisors.
- `categories`, `tags`: Content taxonomy.
- `corporate_news`: Company announcements.

**★重要: 型定義のルール**
microCMSの型定義は、`src/lib/schema/`配下のZodスキーマファイル（例: `article.schema.ts`）を信頼できる唯一の情報源（Single Source of Truth）とします。`z.infer<typeof ...>` を使用して型を推論してください。手動で`*.d.ts`ファイルに型を記述することは禁止です。

### Key Implementation Areas
1. **Authentication Flow**: NextAuth.js configuration in `src/lib/auth/` with Firebase adapter for user data storage and protected routes via middleware.
2. **Paywall Logic**: Check article's `membershipLevel` from microCMS and verify user's subscription status from Firestore. Show a preview for non-members.
3. **Stripe Integration**: Webhook at `/api/stripe/webhook`, subscription management in `/media/mypage/subscription`.
4. **SEO Optimization**: Dynamic metadata generation, structured data (JSON-LD), and targeting Core Web Vitals (LCP < 2s, CLS < 0.1).

## Development Guidelines

### Component Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable React components
├── lib/           # Utilities and integrations (Firebase, Stripe, microCMS)
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── styles/        # Global styles
```

### API Routes Pattern
- Use Next.js Route Handlers in `app/api/`.
- Implement proper error handling.
- Validate inputs with zod.
- Return consistent response formats.

### Testing Approach
- **Unit tests** for utilities and hooks (`*.test.ts`).
- **Component tests** for UI components (`*.test.tsx`).
- **E2E tests** for critical user flows (`*.spec.ts`).
- **You MUST generate Vitest unit tests for all new functions/components. Maintain 100% test coverage.**

## Common Tasks

### Adding a New Article Type
1. Update microCMS schema.
2. Create/update a Zod schema file in `src/lib/schema/`. The TypeScript type will be automatically inferred from this schema.
3. Add/update API client methods in `src/lib/microcms/`.
4. Create components in `src/components/articles/`.
5. Add routes in `src/app/media/`.

### Working with Stripe Webhooks
1. Events to handle: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
2. Update the user's subscription status in the Firestore `members` collection.
3. Log all incoming events for debugging.
4. Ensure the endpoint is idempotent (handles duplicate events gracefully).

## Environment Variables
Required variables (see `DEVELOPMENT_GUIDE.md` for full list and details):
- `NEXT_PUBLIC_FIREBASE_*`: Firebase configuration
- `MICROCMS_SERVICE_DOMAIN`: microCMS domain
- `MICROCMS_API_KEY`: microCMS API key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe public key

## ★ Important Rules
- **Refer to `DEVELOPMENT_GUIDE.md` for any ambiguity.**
- **All code MUST be accompanied by passing tests to achieve 100% coverage.**
- **All major functions and classes MUST have JSDoc comments**, including `@doc`, `@related`, `@issue` where applicable.
- **NEVER hardcode keys or secrets.** Use environment variables.
- **NEVER disable type-checking or test rules to pass CI.**
- **Adhere to the AI Collaboration Policy defined above.**