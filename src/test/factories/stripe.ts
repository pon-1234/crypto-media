/**
 * Stripeテスト用のファクトリ関数
 * @doc DEVELOPMENT_GUIDE.md#テストの実装
 * @related src/lib/stripe/client.ts - Stripe SDK client
 * @issue #8 - Stripe CheckoutとWebhookの実装
 */

import type Stripe from 'stripe'

/**
 * Stripe.ApiListのモックを生成
 * @template T リストアイテムの型
 * @param data リストデータ
 * @returns Stripe.ApiListのモック
 */
export function createMockApiList<T>(data: T[]): Stripe.ApiList<T> {
  return {
    object: 'list',
    data,
    has_more: false,
    url: '/v1/test',
  }
}

/**
 * Stripe.Responseのモックを生成
 * @template T レスポンスデータの型
 * @param data レスポンスデータ
 * @returns Stripe.Responseのモック
 */
export function createMockStripeResponse<T>(data: T): Stripe.Response<T> {
  return {
    ...data,
    lastResponse: {
      headers: {},
      requestId: 'req_test_123',
      statusCode: 200,
    } as Stripe.Response<T>['lastResponse'],
  } as Stripe.Response<T>
}

/**
 * Stripe.Customerのモックを生成
 * @param overrides カスタマイズするプロパティ
 * @returns Stripe.Customerのモック
 */
export function createMockCustomer(overrides?: Partial<Stripe.Customer>): Stripe.Customer {
  return {
    id: 'cus_test_123',
    object: 'customer',
    address: null,
    balance: 0,
    created: Date.now() / 1000,
    currency: 'jpy',
    default_source: null,
    delinquent: false,
    description: null,
    discount: null,
    email: 'test@example.com',
    invoice_prefix: 'INV',
    invoice_settings: {
      custom_fields: null,
      default_payment_method: null,
      footer: null,
      rendering_options: null,
    },
    livemode: false,
    metadata: {},
    name: 'Test User',
    phone: null,
    preferred_locales: ['ja'],
    shipping: null,
    tax_exempt: 'none',
    test_clock: null,
    ...overrides,
  } as Stripe.Customer
}

/**
 * Stripe.Checkout.Sessionのモックを生成
 * @param overrides カスタマイズするプロパティ
 * @returns Stripe.Checkout.Sessionのモック
 */
export function createMockCheckoutSession(
  overrides?: Partial<Stripe.Checkout.Session>
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    after_expiration: null,
    allow_promotion_codes: true,
    amount_subtotal: 1980,
    amount_total: 1980,
    automatic_tax: {
      enabled: false,
      status: null,
    },
    billing_address_collection: 'required',
    cancel_url: 'https://example.com/register?canceled=true',
    client_reference_id: null,
    consent: null,
    consent_collection: null,
    created: Date.now() / 1000,
    currency: 'jpy',
    custom_text: {
      shipping_address: null,
      submit: null,
    },
    customer: null,
    customer_creation: 'if_required',
    customer_details: null,
    customer_email: 'test@example.com',
    expires_at: Date.now() / 1000 + 3600,
    invoice: null,
    invoice_creation: null,
    livemode: false,
    locale: 'ja',
    metadata: {},
    mode: 'subscription',
    payment_intent: null,
    payment_link: null,
    payment_method_collection: 'always',
    payment_method_options: {},
    payment_method_types: ['card'],
    payment_status: 'unpaid',
    phone_number_collection: {
      enabled: false,
    },
    recovered_from: null,
    setup_intent: null,
    shipping_address_collection: null,
    shipping_cost: null,
    shipping_details: null,
    shipping_options: [],
    status: 'open',
    submit_type: null,
    subscription: null,
    success_url: 'https://example.com/media/mypage/membership?success=true',
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 0,
    },
    url: 'https://checkout.stripe.com/pay/cs_test_123',
    ...overrides,
  } as Stripe.Checkout.Session
}

/**
 * Stripe.Eventのモックを生成
 * @param type イベントタイプ
 * @param data イベントデータ
 * @returns Stripe.Eventのモック
 */
export function createMockStripeEvent<T = unknown>(
  type: Stripe.Event['type'],
  data: T
): Stripe.Event {
  return {
    id: 'evt_test_123',
    object: 'event',
    api_version: '2025-02-24',
    created: Date.now() / 1000,
    data: {
      object: data,
      previous_attributes: null,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
    type,
  } as Stripe.Event
}

/**
 * Stripe.Subscriptionのモックを生成
 * @param overrides カスタマイズするプロパティ
 * @returns Stripe.Subscriptionのモック
 */
export function createMockSubscription(
  overrides?: Partial<Stripe.Subscription>
): Stripe.Subscription {
  return {
    id: 'sub_test_123',
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    automatic_tax: {
      enabled: false,
    },
    billing_cycle_anchor: Date.now() / 1000,
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    collection_method: 'charge_automatically',
    created: Date.now() / 1000,
    currency: 'jpy',
    current_period_end: Date.now() / 1000 + 2592000,
    current_period_start: Date.now() / 1000,
    customer: 'cus_test_123',
    days_until_due: null,
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    description: null,
    discount: null,
    ended_at: null,
    items: {
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/subscription_items',
    },
    latest_invoice: null,
    livemode: false,
    metadata: {},
    next_pending_invoice_item_invoice: null,
    pause_collection: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: 'off',
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    plan: null,
    quantity: 1,
    schedule: null,
    start_date: Date.now() / 1000,
    status: 'active',
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_start: null,
    ...overrides,
  } as Stripe.Subscription
}

/**
 * Stripe.PortalSessionのモックを生成
 * @param overrides カスタマイズするプロパティ
 * @returns Stripe.BillingPortal.Sessionのモック
 */
export function createMockPortalSession(
  overrides?: Partial<Stripe.BillingPortal.Session>
): Stripe.BillingPortal.Session {
  return {
    id: 'bps_test_123',
    object: 'billing_portal.session',
    configuration: 'bpc_test_123',
    created: Date.now() / 1000,
    customer: 'cus_test_123',
    livemode: false,
    locale: 'ja',
    on_behalf_of: null,
    return_url: 'https://example.com/media/mypage/membership',
    url: 'https://billing.stripe.com/p/session/test_123',
    ...overrides,
  }
}