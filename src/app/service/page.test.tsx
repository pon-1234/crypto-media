import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ServicePage, { metadata } from './page'

/**
 * 事業内容ページのテスト
 * @issue #12 - コーポレート静的ページの実装
 */
describe('ServicePage', () => {
  it('ページタイトルが正しく表示される', () => {
    render(<ServicePage />)
    const heading = screen.getByRole('heading', { level: 1, name: '事業内容' })
    expect(heading).toBeInTheDocument()
  })

  it('イントロダクションテキストが表示される', () => {
    render(<ServicePage />)
    expect(
      screen.getByText(/私たちは、暗号資産・ブロックチェーン業界に特化したメディア事業を展開しています。/)
    ).toBeInTheDocument()
  })

  it('すべてのサービスセクションが表示される', () => {
    render(<ServicePage />)
    
    // メインセクション
    expect(screen.getByRole('heading', { name: '提供サービス' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'サービスの特徴' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'お問い合わせ' })).toBeInTheDocument()
    
    // 各サービス
    expect(
      screen.getByRole('heading', { name: '1. 暗号資産メディア「Crypto Media」の運営' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '2. 調査・分析レポートサービス' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '3. 有料会員サービス' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '4. 教育・啓蒙活動' })).toBeInTheDocument()
  })

  it('サービスの詳細リストが表示される', () => {
    render(<ServicePage />)
    
    // メディア運営の詳細
    expect(screen.getByText('最新ニュース・速報の配信')).toBeInTheDocument()
    expect(screen.getByText('専門家による市場分析・解説')).toBeInTheDocument()
    
    // 調査レポートの詳細
    expect(screen.getByText('月次市場分析レポート')).toBeInTheDocument()
    expect(screen.getByText('プロジェクト詳細調査')).toBeInTheDocument()
    
    // 有料会員サービスの詳細
    expect(screen.getByText('全プレミアム記事の閲覧')).toBeInTheDocument()
    expect(screen.getByText('会員限定ウェビナーへの参加')).toBeInTheDocument()
    
    // 教育活動の詳細
    expect(screen.getByText('初心者向け入門講座')).toBeInTheDocument()
    expect(screen.getByText('企業向け研修プログラム')).toBeInTheDocument()
  })

  it('サービスの特徴が4つ表示される', () => {
    render(<ServicePage />)
    
    const features = [
      { title: '信頼性', color: 'blue' },
      { title: 'わかりやすさ', color: 'green' },
      { title: '速報性', color: 'purple' },
      { title: '専門性', color: 'orange' },
    ]
    
    features.forEach(({ title }) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    })
  })

  it('お問い合わせリンクが正しく設定されている', () => {
    render(<ServicePage />)
    const contactLink = screen.getByRole('link', { name: 'お問い合わせはこちら' })
    expect(contactLink).toBeInTheDocument()
    expect(contactLink).toHaveAttribute('href', '/contact')
  })

  it('適切なコンテナークラスが適用されている', () => {
    const { container } = render(<ServicePage />)
    const main = container.querySelector('main')
    expect(main).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')
    
    const contentWrapper = container.querySelector('.max-w-4xl')
    expect(contentWrapper).toBeInTheDocument()
  })

  it('有料会員の価格が正しく表示される', () => {
    render(<ServicePage />)
    expect(screen.getByText(/月額1,980円/)).toBeInTheDocument()
  })

  it('メタデータが正しく設定されている', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBe('事業内容')
    expect(metadata.description).toBe(
      '株式会社クリプトメディアの事業内容をご紹介します。暗号資産メディアの運営、調査レポートの作成、有料会員サービス、教育活動など幅広いサービスを提供しています。'
    )
  })
})