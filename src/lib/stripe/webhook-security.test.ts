import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { isStripeIp, logWebhookEvent, WebhookTimer } from './webhook-security'

describe('isStripeIp', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('開発環境では常にtrueを返す', () => {
    vi.stubEnv('NODE_ENV', 'development')
    
    const request = new NextRequest('https://example.com/webhook', {
      headers: new Headers({
        'x-real-ip': '192.168.1.1',
      }),
    })
    
    expect(isStripeIp(request)).toBe(true)
  })

  it('本番環境でStripeのIPアドレスからのリクエストはtrueを返す', () => {
    vi.stubEnv('NODE_ENV', 'production')
    
    const request = new NextRequest('https://example.com/webhook', {
      headers: new Headers({
        'x-real-ip': '3.18.12.33', // StripeのIP範囲内
      }),
    })
    
    expect(isStripeIp(request)).toBe(true)
  })

  it('本番環境で非StripeのIPアドレスからのリクエストはfalseを返す', () => {
    vi.stubEnv('NODE_ENV', 'production')
    
    const request = new NextRequest('https://example.com/webhook', {
      headers: new Headers({
        'x-real-ip': '192.168.1.1', // StripeのIP範囲外
      }),
    })
    
    expect(isStripeIp(request)).toBe(false)
  })

  it('x-forwarded-forヘッダーから最初のIPを使用する', () => {
    vi.stubEnv('NODE_ENV', 'production')
    
    const request = new NextRequest('https://example.com/webhook', {
      headers: new Headers({
        'x-forwarded-for': '3.18.12.33, 192.168.1.1, 10.0.0.1',
      }),
    })
    
    expect(isStripeIp(request)).toBe(true)
  })

  it('IPアドレスが取得できない場合は警告を出してtrueを返す', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const request = new NextRequest('https://example.com/webhook', {
      headers: new Headers({}),
    })
    
    expect(isStripeIp(request)).toBe(true)
    expect(consoleWarnSpy).toHaveBeenCalledWith('Could not determine client IP for Stripe webhook')
  })

  it('様々なStripeのIP範囲をテストする', () => {
    vi.stubEnv('NODE_ENV', 'production')
    
    const stripeIps = [
      '3.130.192.129',  // 3.130.192.128/26
      '13.235.14.130',  // 13.235.14.128/26
      '18.211.135.33',  // 18.211.135.32/27
      '54.187.216.65',  // 54.187.216.64/26
    ]
    
    stripeIps.forEach(ip => {
      const request = new NextRequest('https://example.com/webhook', {
        headers: new Headers({
          'x-real-ip': ip,
        }),
      })
      
      expect(isStripeIp(request)).toBe(true)
    })
  })
})

describe('logWebhookEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('成功したイベントはconsole.logで出力する', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const log = {
      eventId: 'evt_123',
      eventType: 'checkout.session.completed',
      livemode: false,
      receivedAt: '2023-01-01T00:00:00Z',
      success: true,
    }
    
    logWebhookEvent(log)
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        service: 'stripe-webhook',
        ...log,
      })
    )
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('失敗したイベントはconsole.errorで出力する', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const log = {
      eventId: 'evt_123',
      eventType: 'checkout.session.completed',
      livemode: false,
      receivedAt: '2023-01-01T00:00:00Z',
      success: false,
      error: 'Payment failed',
    }
    
    logWebhookEvent(log)
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        service: 'stripe-webhook',
        ...log,
      })
    )
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('メタデータを含むログを出力できる', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const log = {
      eventId: 'evt_123',
      eventType: 'checkout.session.completed',
      livemode: true,
      receivedAt: '2023-01-01T00:00:00Z',
      processedAt: '2023-01-01T00:00:01Z',
      success: true,
      metadata: {
        customerId: 'cus_123',
        amount: 1980,
      },
    }
    
    logWebhookEvent(log)
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        service: 'stripe-webhook',
        ...log,
      })
    )
  })
})

describe('WebhookTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('処理時間を計測できる', () => {
    const timer = new WebhookTimer()
    vi.advanceTimersByTime(100) // 100ms進める
    expect(timer.getDuration()).toBe(100)
  })

  it('処理時間をログに出力できる', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const timer = new WebhookTimer()
    vi.advanceTimersByTime(500) // 500ms進める
    timer.logDuration('checkout.session.completed')

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Webhook processing time for checkout.session.completed: 500ms',
    )
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('処理時間が5秒を超える場合は警告を出力する', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const timer = new WebhookTimer()
    vi.advanceTimersByTime(6000) // 6秒進める
    timer.logDuration('checkout.session.completed')

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Webhook processing time for checkout.session.completed: 6000ms',
    )
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Slow webhook processing detected for checkout.session.completed: 6000ms',
    )
  })

  it('複数のタイマーを独立して使用できる', () => {
    const timer1 = new WebhookTimer()
    vi.advanceTimersByTime(100)
    const timer2 = new WebhookTimer()
    vi.advanceTimersByTime(50)

    expect(timer1.getDuration()).toBe(150)
    expect(timer2.getDuration()).toBe(50)
  })
})