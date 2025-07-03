/**
 * SendGridを使用したメール送信機能を提供するモジュール
 * @doc https://docs.anthropic.com/en/docs/claude-code
 * @issue #123 - SendGrid統合
 */
import sgMail from '@sendgrid/mail'
import { env } from '@/config'

// SendGrid APIキーの初期化
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY)
}

interface MailOptions {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * SendGridの設定が有効かどうかを確認する
 * @returns 設定が有効な場合はtrue
 */
const isSendGridConfigured = (): boolean => {
  return !!(env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL)
}

/**
 * 開発環境でメール内容をコンソールに出力する
 * @param options メール送信オプション
 */
const logEmailContent = (options: MailOptions): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('--- Email Content ---')
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`HTML: ${options.html}`)
    console.log('---------------------')
  }
}

/**
 * SendGridを使用してメールを送信する
 * @param options メール送信オプション
 * @returns Promise<void>
 * @throws {Error} SendGridが設定されていない場合、またはメール送信に失敗した場合
 */
export const sendEmail = async (options: MailOptions): Promise<void> => {
  if (!isSendGridConfigured()) {
    const error = new Error('SendGrid is not configured. SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set.')
    console.error(error.message)
    logEmailContent(options)
    throw error
  }

  const msg = {
    to: options.to,
    from: env.SENDGRID_FROM_EMAIL as string, // 設定チェック済みなので安全にキャスト
    subject: options.subject,
    text: options.text,
    html: options.html,
  }

  try {
    await sgMail.send(msg)
    console.log('Email sent successfully to', options.to)
  } catch (error) {
    console.error('Error sending email with SendGrid:', error)
    throw error
  }
}