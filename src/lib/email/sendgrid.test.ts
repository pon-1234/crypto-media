/**
 * SendGridメール送信機能のユニットテスト
 * @issue #123 - SendGrid統合
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// SendGridのモック
const mockSend = vi.fn()
const mockSetApiKey = vi.fn()

vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: mockSetApiKey,
    send: mockSend,
  },
}))

describe('sendEmail', () => {
  const mailOptions = {
    to: 'recipient@example.com',
    subject: 'Test Subject',
    html: '<p>Test HTML</p>',
    text: 'Test Text',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // モジュールのリセット
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('SendGridが設定されている場合、メールを送信する', async () => {
    // 環境変数をモック
    vi.doMock('@/config', () => ({
      env: {
        SENDGRID_API_KEY: 'test-api-key',
        SENDGRID_FROM_EMAIL: 'test@example.com',
      },
    }))

    mockSend.mockResolvedValue([
      {
        statusCode: 202,
        body: '',
        headers: {},
      },
      {},
    ])

    const { sendEmail } = await import('./sendgrid')
    await sendEmail(mailOptions)

    expect(mockSend).toHaveBeenCalledWith({
      to: mailOptions.to,
      from: 'test@example.com',
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
    })
    expect(console.log).toHaveBeenCalledWith(
      'Email sent successfully to',
      mailOptions.to
    )
  })

  it('SendGridでエラーが発生した場合、エラーをスローする', async () => {
    // 環境変数をモック
    vi.doMock('@/config', () => ({
      env: {
        SENDGRID_API_KEY: 'test-api-key',
        SENDGRID_FROM_EMAIL: 'test@example.com',
      },
    }))

    const error = new Error('SendGrid error')
    mockSend.mockRejectedValue(error)

    const { sendEmail } = await import('./sendgrid')
    await expect(sendEmail(mailOptions)).rejects.toThrow('SendGrid error')
    expect(console.error).toHaveBeenCalledWith(
      'Error sending email with SendGrid:',
      error
    )
  })

  it('SendGridが設定されていない場合、エラーをスローする（APIキーなし）', async () => {
    // envをモックして再インポート
    vi.doMock('@/config', () => ({
      env: {
        SENDGRID_API_KEY: '',
        SENDGRID_FROM_EMAIL: 'test@example.com',
      },
    }))
    const { sendEmail: sendEmailNoKey } = await import('./sendgrid')

    await expect(sendEmailNoKey(mailOptions)).rejects.toThrow(
      'SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.'
    )
    expect(mockSend).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(
      'SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.'
    )
  })

  it('SendGridが設定されていない場合、エラーをスローする（送信元メールなし）', async () => {
    // envをモックして再インポート
    vi.doMock('@/config', () => ({
      env: {
        SENDGRID_API_KEY: 'test-api-key',
        SENDGRID_FROM_EMAIL: '',
      },
    }))
    const { sendEmail: sendEmailNoFrom } = await import('./sendgrid')

    await expect(sendEmailNoFrom(mailOptions)).rejects.toThrow(
      'SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.'
    )
    expect(mockSend).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(
      'SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.'
    )
  })

  it('開発環境でSendGridが設定されていない場合、メール内容をコンソールに出力してエラーをスローする', async () => {
    // テストのためのNODE_ENV変更
    vi.stubEnv('NODE_ENV', 'development')

    // envをモックして再インポート
    vi.doMock('@/config', () => ({
      env: {
        SENDGRID_API_KEY: '',
        SENDGRID_FROM_EMAIL: '',
      },
    }))
    const { sendEmail: sendEmailDev } = await import('./sendgrid')

    await expect(sendEmailDev(mailOptions)).rejects.toThrow(
      'SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.'
    )

    expect(console.log).toHaveBeenCalledWith('--- Email Content ---')
    expect(console.log).toHaveBeenCalledWith(`To: ${mailOptions.to}`)
    expect(console.log).toHaveBeenCalledWith(`Subject: ${mailOptions.subject}`)
    expect(console.log).toHaveBeenCalledWith(`HTML: ${mailOptions.html}`)
    expect(console.log).toHaveBeenCalledWith('---------------------')

    vi.unstubAllEnvs()
  })

  it('本番環境でSendGridが設定されていない場合、メール内容をコンソールに出力せずエラーをスローする', async () => {
    // テストのためのNODE_ENV変更
    vi.stubEnv('NODE_ENV', 'production')

    // envをモックして再インポート
    vi.doMock('@/config', () => ({
      env: {
        SENDGRID_API_KEY: '',
        SENDGRID_FROM_EMAIL: '',
      },
    }))
    const { sendEmail: sendEmailProd } = await import('./sendgrid')

    await expect(sendEmailProd(mailOptions)).rejects.toThrow(
      'SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.'
    )

    expect(console.error).toHaveBeenCalledWith(
      'SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.'
    )
    expect(console.log).not.toHaveBeenCalledWith('--- Email Content ---')

    vi.unstubAllEnvs()
  })
})
