import { NextRequest } from 'next/server';

/**
 * Stripe Webhook Security utilities
 * @doc Security utilities for protecting Stripe webhook endpoints
 * @related src/app/api/stripe/webhook/route.ts - Uses these utilities
 */

// Stripeの公式IPアドレス範囲（定期的に更新が必要）
// https://stripe.com/docs/ips
const STRIPE_IP_RANGES = [
  '3.18.12.32/27',
  '3.130.192.128/26',
  '13.235.14.128/26',
  '13.235.122.128/26',
  '18.211.135.32/27',
  '35.154.171.0/26',
  '52.15.183.32/28',
  '54.187.174.160/27',
  '54.187.205.224/27',
  '54.187.216.64/26',
];

/**
 * IPアドレスがCIDR範囲内にあるかチェック
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * StripeのIPアドレスからのリクエストかチェック
 */
export function isStripeIp(request: NextRequest): boolean {
  const clientIp = request.headers.get('x-real-ip') || 
                  request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  '';
  
  if (!clientIp) {
    console.warn('Could not determine client IP for Stripe webhook');
    return true; // IPが取得できない場合は許可（開発環境など）
  }
  
  // 開発環境では常に許可
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  // StripeのIP範囲をチェック
  return STRIPE_IP_RANGES.some(range => isIpInCidr(clientIp, range));
}

/**
 * Webhookイベントのログ構造
 */
export interface WebhookLog {
  eventId: string;
  eventType: string;
  livemode: boolean;
  receivedAt: string;
  processedAt?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 構造化ログを出力
 */
export function logWebhookEvent(log: WebhookLog): void {
  const logData = {
    service: 'stripe-webhook',
    ...log,
  };
  
  if (log.success) {
    console.log(JSON.stringify(logData));
  } else {
    console.error(JSON.stringify(logData));
  }
}

/**
 * Webhook処理時間の計測
 */
export class WebhookTimer {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  getDuration(): number {
    return Date.now() - this.startTime;
  }
  
  logDuration(eventType: string): void {
    const duration = this.getDuration();
    console.log(`Webhook processing time for ${eventType}: ${duration}ms`);
    
    // 処理時間が長い場合は警告
    if (duration > 5000) {
      console.warn(`Slow webhook processing detected for ${eventType}: ${duration}ms`);
    }
  }
}