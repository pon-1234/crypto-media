import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TermsPage, { metadata } from './page'

/**
 * 利用規約ページのテスト
 * @issue #12 - コーポレート静的ページの実装
 */
describe('TermsPage', () => {
  it('利用規約ページが正しくレンダリングされる', () => {
    render(<TermsPage />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('利用規約')
  })

  it('最終更新日が表示される', () => {
    render(<TermsPage />)
    
    expect(screen.getByText('最終更新日: 2024年1月1日')).toBeInTheDocument()
  })

  it('すべての利用規約セクションが表示される', () => {
    render(<TermsPage />)
    
    const sections = [
      '第1条（適用）',
      '第2条（利用登録）',
      '第3条（ユーザーIDおよびパスワードの管理）',
      '第4条（利用料金および支払方法）',
      '第5条（禁止事項）',
      '第6条（本サービスの提供の停止等）',
      '第7条（著作権）',
      '第8条（免責事項）',
      '第9条（サービス内容の変更等）',
      '第10条（利用規約の変更）',
      '第11条（個人情報の取扱い）',
      '第12条（通知または連絡）',
      '第13条（権利義務の譲渡の禁止）',
      '第14条（準拠法・裁判管轄）',
    ]

    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument()
    })
  })

  it('禁止事項のリストが表示される', () => {
    render(<TermsPage />)
    
    const prohibitedItems = [
      '法令または公序良俗に違反する行為',
      '犯罪行為に関連する行為',
      '当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為',
      '本サービスによって得られた情報を商業的に利用する行為',
      '不正アクセスをし、またはこれを試みる行為',
    ]

    prohibitedItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  it('会社名が正しく表示される', () => {
    render(<TermsPage />)
    
    const companyNames = screen.getAllByText('Crypto Media')
    expect(companyNames.length).toBeGreaterThan(0)
  })

  it('メタデータが正しく設定される', () => {
    expect(metadata).toEqual({
      title: '利用規約 | Crypto Media',
      description: 'Crypto Mediaの利用規約について。サービスの利用条件、会員規約、免責事項などを記載しています。',
      openGraph: {
        title: '利用規約 | Crypto Media',
        description: 'Crypto Mediaの利用規約について',
      },
    })
  })
})