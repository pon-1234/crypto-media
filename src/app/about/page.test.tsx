import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AboutPage, { metadata } from './page'

/**
 * 会社概要ページのテスト
 * @issue #12 - コーポレート静的ページの実装
 */
describe('AboutPage', () => {
  it('ページタイトルが正しく表示される', () => {
    render(<AboutPage />)
    const heading = screen.getByRole('heading', { level: 1, name: '会社概要' })
    expect(heading).toBeInTheDocument()
  })

  it('すべてのセクションが表示される', () => {
    render(<AboutPage />)
    
    // セクションタイトルの確認
    expect(screen.getByRole('heading', { name: '私たちについて' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '会社情報' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ミッション' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ビジョン' })).toBeInTheDocument()
  })

  it('会社情報テーブルが正しく表示される', () => {
    render(<AboutPage />)
    
    // テーブルヘッダーの確認
    expect(screen.getByText('会社名')).toBeInTheDocument()
    expect(screen.getByText('設立')).toBeInTheDocument()
    expect(screen.getByText('代表取締役')).toBeInTheDocument()
    expect(screen.getByText('資本金')).toBeInTheDocument()
    expect(screen.getByText('所在地')).toBeInTheDocument()
    expect(screen.getByText('従業員数')).toBeInTheDocument()
    expect(screen.getByText('事業内容')).toBeInTheDocument()
    
    // テーブルデータの確認
    expect(screen.getByText('株式会社クリプトメディア')).toBeInTheDocument()
    expect(screen.getByText('2023年4月1日')).toBeInTheDocument()
    expect(screen.getByText('山田 太郎')).toBeInTheDocument()
    expect(screen.getByText('1,000万円')).toBeInTheDocument()
    expect(screen.getByText('25名（2025年1月現在）')).toBeInTheDocument()
  })

  it('ミッションが正しく表示される', () => {
    render(<AboutPage />)
    expect(
      screen.getByText('「暗号資産の世界を、もっと身近に、もっと安心に」')
    ).toBeInTheDocument()
  })

  it('ビジョンリストが正しく表示される', () => {
    render(<AboutPage />)
    
    const visionItems = [
      '正確で信頼できる情報の提供を通じて、暗号資産市場の健全な発展に貢献する',
      '初心者から上級者まで、すべての人に価値ある知識とインサイトを届ける',
      'ブロックチェーン技術が創る新しい未来を、わかりやすく伝える',
    ]
    
    visionItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  it('適切なコンテナークラスが適用されている', () => {
    const { container } = render(<AboutPage />)
    const main = container.querySelector('main')
    expect(main).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')
    
    const contentWrapper = container.querySelector('.max-w-4xl')
    expect(contentWrapper).toBeInTheDocument()
  })

  it('メタデータが正しく設定されている', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBe('会社概要')
    expect(metadata.description).toBe(
      '株式会社クリプトメディアの会社概要です。私たちは暗号資産・ブロックチェーン技術の最新情報を発信するメディアプラットフォームを運営しています。'
    )
  })
})