import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPolicyPage, { metadata } from './page'

/**
 * プライバシーポリシーページのテスト
 * @issue #12 - コーポレート静的ページの実装
 */
describe('PrivacyPolicyPage', () => {
  it('プライバシーポリシーページが正しくレンダリングされる', () => {
    render(<PrivacyPolicyPage />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('プライバシーポリシー')
  })

  it('最終更新日が表示される', () => {
    render(<PrivacyPolicyPage />)
    
    expect(screen.getByText('最終更新日: 2024年1月1日')).toBeInTheDocument()
  })

  it('すべてのプライバシーポリシーセクションが表示される', () => {
    render(<PrivacyPolicyPage />)
    
    const sections = [
      '第1条（個人情報）',
      '第2条（個人情報の収集方法）',
      '第3条（個人情報を収集・利用する目的）',
      '第4条（利用目的の変更）',
      '第5条（個人情報の第三者提供）',
      '第6条（個人情報の開示）',
      '第7条（個人情報の訂正および削除）',
      '第8条（個人情報の利用停止等）',
      '第9条（プライバシーポリシーの変更）',
      '第10条（お問い合わせ窓口）',
      '第11条（Cookie（クッキー）について）',
      '第12条（アクセス解析ツールについて）',
    ]

    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument()
    })
  })

  it('個人情報の利用目的リストが表示される', () => {
    render(<PrivacyPolicyPage />)
    
    const purposes = [
      '当社サービスの提供・運営のため',
      'ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）',
      'メンテナンス、重要なお知らせなど必要に応じたご連絡のため',
      '有料サービスにおいて、ユーザーに利用料金を請求するため',
    ]

    purposes.forEach(purpose => {
      expect(screen.getByText(purpose)).toBeInTheDocument()
    })
  })

  it('お問い合わせ窓口情報が表示される', () => {
    render(<PrivacyPolicyPage />)
    
    expect(screen.getByText('社名: Crypto Media')).toBeInTheDocument()
    expect(screen.getByText('Eメールアドレス: privacy@cryptomedia.jp')).toBeInTheDocument()
  })

  it('Cookieに関する説明が表示される', () => {
    render(<PrivacyPolicyPage />)
    
    expect(screen.getByText(/Cookie（クッキー）とは、ウェブサイトを利用したときに/)).toBeInTheDocument()
  })

  it('Googleアナリティクスに関する説明が表示される', () => {
    render(<PrivacyPolicyPage />)
    
    expect(screen.getByText(/当社は、お客様のアクセス傾向を把握するために、「Googleアナリティクス」/)).toBeInTheDocument()
  })

  it('会社名が正しく表示される', () => {
    render(<PrivacyPolicyPage />)
    
    const companyNames = screen.getAllByText('Crypto Media')
    expect(companyNames.length).toBeGreaterThan(0)
  })

  it('メタデータが正しく設定される', () => {
    expect(metadata).toEqual({
      title: 'プライバシーポリシー | Crypto Media',
      description: 'Crypto Mediaのプライバシーポリシー。個人情報の取扱い、利用目的、安全管理措置などについて記載しています。',
      openGraph: {
        title: 'プライバシーポリシー | Crypto Media',
        description: 'Crypto Mediaのプライバシーポリシー',
      },
    })
  })
})