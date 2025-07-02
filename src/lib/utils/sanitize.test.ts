import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeRichText } from './sanitize'

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = sanitizeHtml(input)
    expect(result).toBe('<p>Hello <strong>world</strong></p>')
  })

  it('should remove dangerous script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>'
    const result = sanitizeHtml(input)
    expect(result).toBe('<p>Hello</p>')
  })

  it('should remove event handlers', () => {
    const input = '<img src="x" onerror="alert(\'XSS\')" />'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onerror')
  })

  it('should allow safe links', () => {
    const input = '<a href="https://example.com" target="_blank">Link</a>'
    const result = sanitizeHtml(input)
    // DOMPurify may reorder attributes, so check for presence instead of exact match
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('target="_blank"')
    expect(result).toContain('>Link</a>')
  })

  it('should remove javascript: URLs', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Click me</a>'
    const result = sanitizeHtml(input)
    expect(result).toBe('<a>Click me</a>')
  })

  it('should handle complex HTML structures', () => {
    const input = `
      <div>
        <h2>Title</h2>
        <p>Paragraph with <em>emphasis</em></p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <table>
          <tr>
            <th>Header</th>
            <td>Data</td>
          </tr>
        </table>
      </div>
    `
    const result = sanitizeHtml(input)
    expect(result).toContain('<h2>Title</h2>')
    expect(result).toContain('<em>emphasis</em>')
    expect(result).toContain('<table>')
    expect(result).toContain('<th>Header</th>')
  })

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('should handle plain text', () => {
    const input = 'Just plain text'
    expect(sanitizeHtml(input)).toBe('Just plain text')
  })
})

describe('sanitizeRichText', () => {
  it('should allow limited set of tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = sanitizeRichText(input)
    expect(result).toBe('<p>Hello <strong>world</strong></p>')
  })

  it('should remove table tags in rich text mode', () => {
    const input = '<table><tr><td>Data</td></tr></table>'
    const result = sanitizeRichText(input)
    expect(result).toBe('Data')
  })

  it('should remove style tags and attributes', () => {
    const input =
      '<p style="color: red;">Text</p><style>body { color: red; }</style>'
    const result = sanitizeRichText(input)
    expect(result).toBe('<p>Text</p>')
  })

  it('should forbid iframe tags', () => {
    const input = '<iframe src="https://example.com"></iframe>'
    const result = sanitizeRichText(input)
    expect(result).toBe('')
  })

  it('should allow code blocks', () => {
    const input = '<pre><code>const x = 1;</code></pre>'
    const result = sanitizeRichText(input)
    expect(result).toBe('<pre><code>const x = 1;</code></pre>')
  })
})
