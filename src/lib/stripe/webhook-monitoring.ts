import { adminDb } from '@/lib/firebase/admin'

/**
 * Webhook monitoring and alerting utilities
 * @doc Monitoring utilities for Stripe webhook health
 * @related src/app/api/stripe/webhook/route.ts
 */

export interface WebhookMetrics {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  averageProcessingTime: number
  slowestProcessingTime: number
  errorsByType: Record<string, number>
}

/**
 * Webhook監視用のメトリクス収集
 */
export async function collectWebhookMetrics(
  timeRangeHours: number = 24
): Promise<WebhookMetrics> {
  const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000)
  
  try {
    const eventsSnapshot = await adminDb
      .collection('webhook_events')
      .where('processed_at', '>=', since.toISOString())
      .get()
    
    const metrics: WebhookMetrics = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      averageProcessingTime: 0,
      slowestProcessingTime: 0,
      errorsByType: {},
    }
    
    let totalProcessingTime = 0
    
    eventsSnapshot.forEach((doc) => {
      const data = doc.data()
      metrics.totalEvents++
      
      if (data.success !== false) {
        metrics.successfulEvents++
      } else {
        metrics.failedEvents++
        const errorType = data.error || 'unknown'
        metrics.errorsByType[errorType] = (metrics.errorsByType[errorType] || 0) + 1
      }
      
      if (data.processingTime) {
        totalProcessingTime += data.processingTime
        metrics.slowestProcessingTime = Math.max(
          metrics.slowestProcessingTime,
          data.processingTime
        )
      }
    })
    
    if (metrics.totalEvents > 0) {
      metrics.averageProcessingTime = totalProcessingTime / metrics.totalEvents
    }
    
    return metrics
  } catch (error) {
    console.error('Failed to collect webhook metrics:', error)
    throw error
  }
}

/**
 * 異常なWebhookパターンの検出
 */
export async function detectAnomalies(): Promise<string[]> {
  const alerts: string[] = []
  
  try {
    const metrics = await collectWebhookMetrics(1) // 過去1時間
    
    // エラー率が高い場合
    if (metrics.totalEvents > 10 && metrics.failedEvents / metrics.totalEvents > 0.1) {
      alerts.push(
        `High error rate detected: ${((metrics.failedEvents / metrics.totalEvents) * 100).toFixed(1)}% in the last hour`
      )
    }
    
    // 処理時間が遅い場合
    if (metrics.averageProcessingTime > 3000) {
      alerts.push(
        `Slow webhook processing: average ${metrics.averageProcessingTime.toFixed(0)}ms`
      )
    }
    
    // 重複イベントの検出
    const duplicatesSnapshot = await adminDb
      .collection('webhook_events')
      .where('type', '==', 'duplicate_subscription_attempt')
      .where('processed_at', '>=', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .get()
    
    if (duplicatesSnapshot.size > 0) {
      alerts.push(
        `${duplicatesSnapshot.size} duplicate subscription attempts in the last hour`
      )
    }
    
    return alerts
  } catch (error) {
    console.error('Failed to detect anomalies:', error)
    return [`Anomaly detection failed: ${error}`]
  }
}

/**
 * アラート通知（本番環境では実装が必要）
 */
export async function sendAlert(message: string, severity: 'info' | 'warning' | 'critical'): Promise<void> {
  console.log(`[${severity.toUpperCase()}] ${message}`)
  
  // TODO: 本番環境では以下を実装
  // - Slackへの通知
  // - メール通知
  // - PagerDutyへのアラート
  
  try {
    // アラートをFirestoreに記録
    await adminDb.collection('webhook_alerts').add({
      message,
      severity,
      createdAt: new Date().toISOString(),
      resolved: false,
    })
  } catch (error) {
    console.error('Failed to save alert to Firestore:', error)
    // エラーをスローしない（アラート送信の失敗でアプリケーションを停止させない）
  }
}