/**
 * @doc HTML sanitization utility for XSS protection
 * @issue Gemini review recommendation - XSS protection
 */
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML content
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html: string): string {
  // Configure DOMPurify to allow safe HTML elements and attributes
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'em', 'strong', 'b', 'i', 'u',
      'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption', 'picture', 'source'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title', 'class', 'id', 'style',
      'src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes',
      'colspan', 'rowspan', 'scope'
    ],
    ALLOW_DATA_ATTR: false,
    // Allow only safe URL schemes
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  }

  return DOMPurify.sanitize(html, config)
}

/**
 * Sanitize HTML for rich text content with stricter rules
 * @param html - Raw HTML content
 * @returns Sanitized HTML with limited tags
 */
export function sanitizeRichText(html: string): string {
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li', 'blockquote', 'a', 'em', 'strong', 'b', 'i',
      'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
  }

  return DOMPurify.sanitize(html, config)
}