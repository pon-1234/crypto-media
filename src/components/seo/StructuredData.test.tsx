import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredData } from './StructuredData';

describe('StructuredData', () => {
  it('should render script tag with JSON-LD data', () => {
    const testData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Test Organization',
    };

    const { container } = render(<StructuredData data={testData} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    expect(script?.innerHTML).toBe(JSON.stringify(testData));
  });

  it('should set correct script id based on @type', () => {
    const testData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Test Website',
    };

    const { container } = render(<StructuredData data={testData} />);
    
    const script = container.querySelector('script#structured-data-WebSite');
    expect(script).toBeTruthy();
  });

  it('should handle nested data structures', () => {
    const testData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://example.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Category',
          item: 'https://example.com/category',
        },
      ],
    };

    const { container } = render(<StructuredData data={testData} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).toBe(JSON.stringify(testData));
  });

  it('should escape special characters in JSON', () => {
    const testData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      name: 'Test "Article" with <special> characters',
    };

    const { container } = render(<StructuredData data={testData} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    // JSON.stringify properly escapes special characters
    expect(script?.innerHTML).toContain('Test \\"Article\\" with <special> characters');
  });
});