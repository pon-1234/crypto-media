/**
 * コーポレートサイトお問い合わせページのテスト
 * @issue #13 - HubSpotフォーム統合
 */
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import ContactPage from './page'

// HubSpotFormコンポーネントのモック
vi.mock('@/components/forms/HubSpotForm', () => ({
  HubSpotForm: ({
    portalId,
    formId,
    targetId,
    className,
    onFormSubmitted,
  }: {
    portalId: string
    formId: string
    targetId: string
    className?: string
    onFormSubmitted?: () => void
  }) => (
    <div
      data-testid="hubspot-form"
      data-portal-id={portalId}
      data-form-id={formId}
      data-target-id={targetId}
      className={className}
      onClick={onFormSubmitted}
    >
      HubSpot Form Mock
    </div>
  ),
}))

describe('ContactPage', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // 環境変数をリセット
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv
  })

  it('ページタイトルと説明文を表示する', () => {
    render(<ContactPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'お問い合わせ' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/お問い合わせは下記フォームよりお願いいたします/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/通常、2営業日以内にご返信いたします/)
    ).toBeInTheDocument()
  })

  it('環境変数が設定されている場合、HubSpotフォームを表示する', () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = '123456'
    process.env.NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID = 'form-abc'

    render(<ContactPage />)

    const form = screen.getByTestId('hubspot-form')
    expect(form).toBeInTheDocument()
    expect(form).toHaveAttribute('data-portal-id', '123456')
    expect(form).toHaveAttribute('data-form-id', 'form-abc')
    expect(form).toHaveAttribute('data-target-id', 'corporate-contact-form')
    expect(form).toHaveClass('hubspot-form-container')
  })

  it('環境変数が設定されていない場合、警告メッセージを表示する', () => {
    delete process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
    delete process.env.NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID

    render(<ContactPage />)

    expect(screen.queryByTestId('hubspot-form')).not.toBeInTheDocument()
    expect(
      screen.getByText('お問い合わせフォームの設定が必要です')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/環境変数 NEXT_PUBLIC_HUBSPOT_PORTAL_ID/)
    ).toBeInTheDocument()
  })

  it('ポータルIDのみ設定されている場合も警告メッセージを表示する', () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = '123456'
    delete process.env.NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID

    render(<ContactPage />)

    expect(screen.queryByTestId('hubspot-form')).not.toBeInTheDocument()
    expect(
      screen.getByText('お問い合わせフォームの設定が必要です')
    ).toBeInTheDocument()
  })

  it('フォームIDのみ設定されている場合も警告メッセージを表示する', () => {
    delete process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
    process.env.NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID = 'form-abc'

    render(<ContactPage />)

    expect(screen.queryByTestId('hubspot-form')).not.toBeInTheDocument()
    expect(
      screen.getByText('お問い合わせフォームの設定が必要です')
    ).toBeInTheDocument()
  })

  it('フォーム送信時にコンソールログを出力する', () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = '123456'
    process.env.NEXT_PUBLIC_HUBSPOT_CORPORATE_FORM_ID = 'form-abc'

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<ContactPage />)

    const form = screen.getByTestId('hubspot-form')
    form.click() // onFormSubmittedを実行

    expect(consoleSpy).toHaveBeenCalledWith(
      'お問い合わせフォームが送信されました'
    )

    consoleSpy.mockRestore()
  })
})
