import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { collectWebhookMetrics, detectAnomalies, sendAlert } from './webhook-monitoring'
import { adminDb } from '@/lib/firebase/admin'

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}))

describe('collectWebhookMetrics', () => {
  const mockCollection = vi.fn()
  const mockWhere = vi.fn()
  const mockGet = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // チェーン可能なモックのセットアップ
    mockCollection.mockReturnValue({ where: mockWhere })
    mockWhere.mockReturnValue({ get: mockGet })
    ;(adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation(
      mockCollection,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('正常なメトリクスを収集できる', async () => {
    type MockData = {
      success: boolean
      processingTime: number
      error?: string
    }
    type MockDoc = { data: () => MockData }
    const mockDocs: MockDoc[] = [
      {
        data: () => ({
          success: true,
          processingTime: 100,
        }),
      },
      {
        data: () => ({
          success: true,
          processingTime: 200,
        }),
      },
      {
        data: () => ({
          success: false,
          error: 'payment_failed',
          processingTime: 150,
        }),
      },
    ]

    mockGet.mockResolvedValue({
      forEach: (callback: (doc: MockDoc) => void) => mockDocs.forEach(callback),
    })

    const metrics = await collectWebhookMetrics(24)

    expect(metrics).toEqual({
      totalEvents: 3,
      successfulEvents: 2,
      failedEvents: 1,
      averageProcessingTime: 150,
      slowestProcessingTime: 200,
      errorsByType: { payment_failed: 1 },
    })

    expect(mockCollection).toHaveBeenCalledWith('webhook_events')
    expect(mockWhere).toHaveBeenCalledWith('processed_at', '>=', expect.any(String))
  })

  it('イベントがない場合のメトリクスを返す', async () => {
    type MockDoc = { data: () => Record<string, never> }
    mockGet.mockResolvedValue({
      forEach: (callback: (doc: MockDoc) => void) => [].forEach(callback),
    })

    const metrics = await collectWebhookMetrics(24)

    expect(metrics).toEqual({
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      averageProcessingTime: 0,
      slowestProcessingTime: 0,
      errorsByType: {},
    })
  })

  it('エラータイプが不明な場合は"unknown"として記録する', async () => {
    type MockData = {
      success: boolean
      processingTime: number
      error?: string
    }
    type MockDoc = { data: () => MockData }
    const mockDocs: MockDoc[] = [
      {
        data: () => ({
          success: false,
          processingTime: 100,
        }),
      },
    ]

    mockGet.mockResolvedValue({
      forEach: (callback: (doc: MockDoc) => void) => mockDocs.forEach(callback),
    })

    const metrics = await collectWebhookMetrics(24)

    expect(metrics.errorsByType).toEqual({ unknown: 1 })
  })

  it('データベースエラーの場合はエラーをスローする', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Database error')
    mockGet.mockRejectedValue(error)

    await expect(collectWebhookMetrics(24)).rejects.toThrow('Database error')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to collect webhook metrics:',
      error,
    )
  })

  it('カスタム時間範囲を指定できる', async () => {
    type MockDoc = { data: () => Record<string, never> }
    mockGet.mockResolvedValue({
      forEach: (callback: (doc: MockDoc) => void) => [].forEach(callback),
    })

    await collectWebhookMetrics(48)

    const whereCall = mockWhere.mock.calls[0]
    const timestampArg = whereCall[2]
    const timestamp = new Date(timestampArg)
    const hoursDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60)
    
    expect(hoursDiff).toBeCloseTo(48, 0)
  })
})

describe('detectAnomalies', () => {
  const mockCollection = vi.fn()
  const mockWhere = vi.fn()
  const mockGet = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // デフォルトのモック設定
    mockCollection.mockReturnValue({ where: mockWhere })
    mockWhere.mockReturnValue({ where: mockWhere, get: mockGet })
    ;(adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation(
      mockCollection,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('高いエラー率を検出する', async () => {
    // メトリクス収集のモック
    type MockData = {
      success: boolean
      processingTime: number
      error?: string
    }
    type MockDoc = { data: () => MockData }
    const metricsSnapshot = {
      forEach: (callback: (doc: MockDoc) => void) => {
        // 20件中5件失敗（25%エラー率）
        for (let i = 0; i < 15; i++) {
          callback({ data: () => ({ success: true, processingTime: 100 }) })
        }
        for (let i = 0; i < 5; i++) {
          callback({
            data: () => ({ success: false, error: 'error', processingTime: 100 }),
          })
        }
      },
    }

    // 重複イベントのモック
    const duplicatesSnapshot = { size: 0 }

    mockGet
      .mockResolvedValueOnce(metricsSnapshot)
      .mockResolvedValueOnce(duplicatesSnapshot)

    const alerts = await detectAnomalies()

    expect(alerts).toContain('High error rate detected: 25.0% in the last hour')
  })

  it('処理時間が遅い場合を検出する', async () => {
    // 平均処理時間4000msのモック
    type MockData = {
      success: boolean
      processingTime: number
      error?: string
    }
    type MockDoc = { data: () => MockData }
    const metricsSnapshot = {
      forEach: (callback: (doc: MockDoc) => void) => {
        callback({ data: () => ({ success: true, processingTime: 4000 }) })
      },
    }

    const duplicatesSnapshot = { size: 0 }

    mockGet
      .mockResolvedValueOnce(metricsSnapshot)
      .mockResolvedValueOnce(duplicatesSnapshot)

    const alerts = await detectAnomalies()

    expect(alerts).toContain('Slow webhook processing: average 4000ms')
  })

  it('重複サブスクリプション試行を検出する', async () => {
    // 正常なメトリクスのモック
    type MockData = {
      success: boolean
      processingTime: number
      error?: string
    }
    type MockDoc = { data: () => MockData }
    const metricsSnapshot = {
      forEach: (callback: (doc: MockDoc) => void) => {
        callback({ data: () => ({ success: true, processingTime: 100 }) })
      },
    }

    // 3件の重複イベント
    const duplicatesSnapshot = { size: 3 }

    mockGet
      .mockResolvedValueOnce(metricsSnapshot)
      .mockResolvedValueOnce(duplicatesSnapshot)

    const alerts = await detectAnomalies()

    expect(alerts).toContain('3 duplicate subscription attempts in the last hour')
  })

  it('問題がない場合は空の配列を返す', async () => {
    // 正常なメトリクス
    type MockData = {
      success: boolean
      processingTime: number
      error?: string
    }
    type MockDoc = { data: () => MockData }
    const metricsSnapshot = {
      forEach: (callback: (doc: MockDoc) => void) => {
        for (let i = 0; i < 10; i++) {
          callback({ data: () => ({ success: true, processingTime: 100 }) })
        }
      },
    }

    const duplicatesSnapshot = { size: 0 }

    mockGet
      .mockResolvedValueOnce(metricsSnapshot)
      .mockResolvedValueOnce(duplicatesSnapshot)

    const alerts = await detectAnomalies()

    expect(alerts).toEqual([])
  })

  it('エラーが発生した場合はエラーメッセージを返す', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Database connection failed')
    mockGet.mockRejectedValue(error)

    const alerts = await detectAnomalies()

    expect(alerts).toEqual([
      'Anomaly detection failed: Error: Database connection failed',
    ])
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to detect anomalies:', error)
  })

  it('イベント数が少ない場合はエラー率のアラートを出さない', async () => {
    // 5件中2件失敗（40%エラー率だが、総数が10件以下）
    type MockData = {
      success: boolean
      processingTime: number
      error?: string
    }
    type MockDoc = { data: () => MockData }
    const metricsSnapshot = {
      forEach: (callback: (doc: MockDoc) => void) => {
        for (let i = 0; i < 3; i++) {
          callback({ data: () => ({ success: true, processingTime: 100 }) })
        }
        for (let i = 0; i < 2; i++) {
          callback({
            data: () => ({ success: false, error: 'error', processingTime: 100 }),
          })
        }
      },
    }

    const duplicatesSnapshot = { size: 0 }

    mockGet
      .mockResolvedValueOnce(metricsSnapshot)
      .mockResolvedValueOnce(duplicatesSnapshot)

    const alerts = await detectAnomalies()

    expect(alerts).toEqual([])
  })
})

describe('sendAlert', () => {
  const mockCollection = vi.fn()
  const mockAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCollection.mockReturnValue({ add: mockAdd })
    ;(adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation(
      mockCollection,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('infoレベルのアラートを送信できる', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockAdd.mockResolvedValue({ id: 'alert123' })

    await sendAlert('Test info message', 'info')

    expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test info message')
    expect(mockCollection).toHaveBeenCalledWith('webhook_alerts')
    expect(mockAdd).toHaveBeenCalledWith({
      message: 'Test info message',
      severity: 'info',
      createdAt: expect.any(String),
      resolved: false,
    })
  })

  it('warningレベルのアラートを送信できる', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockAdd.mockResolvedValue({ id: 'alert123' })

    await sendAlert('Test warning message', 'warning')

    expect(consoleLogSpy).toHaveBeenCalledWith('[WARNING] Test warning message')
    expect(mockAdd).toHaveBeenCalledWith({
      message: 'Test warning message',
      severity: 'warning',
      createdAt: expect.any(String),
      resolved: false,
    })
  })

  it('criticalレベルのアラートを送信できる', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockAdd.mockResolvedValue({ id: 'alert123' })

    await sendAlert('Test critical message', 'critical')

    expect(consoleLogSpy).toHaveBeenCalledWith('[CRITICAL] Test critical message')
    expect(mockAdd).toHaveBeenCalledWith({
      message: 'Test critical message',
      severity: 'critical',
      createdAt: expect.any(String),
      resolved: false,
    })
  })

  it('Firestoreへの保存が失敗してもエラーを投げない', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockAdd.mockRejectedValue(new Error('Firestore error'))

    // エラーを投げずに完了する
    await expect(sendAlert('Test message', 'info')).resolves.toBeUndefined()

    expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test message')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to save alert to Firestore:',
      expect.any(Error),
    )
  })
})