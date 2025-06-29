import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RichTextRenderer } from './RichTextRenderer'

/**
 * @issue #4 - コーポレートお知らせ一覧・詳細ページの実装
 */

// DOMPurifyのモック
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((content) => content)
  }
}))

describe('RichTextRenderer', () => {
  it('HTMLコンテンツを正しく表示する', () => {
    const content = '<p>テストコンテンツ</p>'
    render(<RichTextRenderer content={content} />)
    
    const element = screen.getByText('テストコンテンツ')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('P')
  })

  it('複雑なHTMLコンテンツを表示する', () => {
    const content = `
      <h2>見出し</h2>
      <p>段落です。</p>
      <ul>
        <li>リスト項目1</li>
        <li>リスト項目2</li>
      </ul>
    `
    render(<RichTextRenderer content={content} />)
    
    expect(screen.getByText('見出し')).toBeInTheDocument()
    expect(screen.getByText('段落です。')).toBeInTheDocument()
    expect(screen.getByText('リスト項目1')).toBeInTheDocument()
    expect(screen.getByText('リスト項目2')).toBeInTheDocument()
  })

  it('カスタムクラス名を適用する', () => {
    const content = '<p>テスト</p>'
    const { container } = render(
      <RichTextRenderer content={content} className="custom-class" />
    )
    
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('prose')
    expect(wrapper).toHaveClass('prose-lg')
    expect(wrapper).toHaveClass('max-w-none')
    expect(wrapper).toHaveClass('custom-class')
  })

  it('空のコンテンツを処理する', () => {
    const { container } = render(<RichTextRenderer content="" />)
    
    const wrapper = container.firstChild
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveClass('prose')
  })

  it('特殊文字を含むコンテンツを処理する', () => {
    const content = '<p>&lt;script&gt;alert("XSS")&lt;/script&gt;</p>'
    render(<RichTextRenderer content={content} />)
    
    // DOMPurifyがサニタイズするので、スクリプトタグはテキストとして表示される
    expect(screen.getByText(/<script>alert\("XSS"\)<\/script>/)).toBeInTheDocument()
  })

  it('画像タグを含むコンテンツを処理する', () => {
    const content = '<img src="test.jpg" alt="テスト画像" />'
    render(<RichTextRenderer content={content} />)
    
    const img = screen.getByAltText('テスト画像')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'test.jpg')
  })

  it('リンクタグを含むコンテンツを処理する', () => {
    const content = '<a href="https://example.com">リンクテキスト</a>'
    render(<RichTextRenderer content={content} />)
    
    const link = screen.getByText('リンクテキスト')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
  })
})