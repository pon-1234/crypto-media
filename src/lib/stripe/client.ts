import Stripe from 'stripe';

/**
 * Stripe SDK client for server-side operations
 * @doc Initialize Stripe SDK with environment variable
 * @related src/app/api/stripe/create-checkout-session/route.ts - Uses this client for creating checkout sessions
 * @related src/app/api/stripe/webhook/route.ts - Uses this client for webhook event construction
 */

// 環境変数の検証（起動時に実行）
const validateStripeConfig = () => {
  const errors: string[] = [];
  
  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is not defined');
  }
  
  if (!process.env.STRIPE_MONTHLY_PRICE_ID) {
    errors.push('STRIPE_MONTHLY_PRICE_ID is not defined');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push('STRIPE_WEBHOOK_SECRET is not defined');
  }
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
  }
  
  if (errors.length > 0) {
    const errorMessage = `Stripe configuration errors:\n${errors.join('\n')}`;
    
    // 開発環境では警告、本番環境ではエラー
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    } else {
      console.error(errorMessage);
    }
  }
  
  // API Keyの形式チェック
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY must start with "sk_"');
  }
  
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && 
      !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with "pk_"');
  }
};

// 初期化時に検証を実行
validateStripeConfig();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
  // 本番環境でのベストプラクティス設定
  maxNetworkRetries: 2,
  timeout: 30000, // 30秒のタイムアウト
});

/**
 * Stripe Price ID for the monthly subscription plan (¥1,980/month)
 */
export const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID!;

/**
 * Stripe configuration helper
 */
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  monthlyPriceId: MONTHLY_PRICE_ID,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  // 日本市場向けの設定
  currency: 'jpy' as const,
  locale: 'ja' as const,
};