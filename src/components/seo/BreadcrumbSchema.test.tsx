import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BreadcrumbSchema } from './BreadcrumbSchema';

describe('BreadcrumbSchema', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://crypto-media.jp';
  });

  it('should render BreadcrumbList structured data', () => {
    const items = [
      { name: 'ホーム', url: '/' },
      { name: 'メディア', url: '/media' },
    ];
    
    const { container } = render(<BreadcrumbSchema items={items} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    
    const data = JSON.parse(script?.innerHTML || '{}');
    expect(data['@type']).toBe('BreadcrumbList');
  });

  it('should correctly format breadcrumb items', () => {
    const items = [
      { name: 'ホーム', url: '/' },
      { name: 'メディア', url: '/media' },
      { name: '記事一覧', url: '/media/articles' },
    ];
    
    const { container } = render(<BreadcrumbSchema items={items} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    expect(data.itemListElement).toHaveLength(3);
    
    // 各アイテムの確認
    expect(data.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'ホーム',
      item: 'https://crypto-media.jp/',
    });
    
    expect(data.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      name: 'メディア',
      item: 'https://crypto-media.jp/media',
    });
    
    expect(data.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: '記事一覧',
      item: 'https://crypto-media.jp/media/articles',
    });
  });

  it('should handle absolute URLs', () => {
    const items = [
      { name: 'External Site', url: 'https://example.com' },
      { name: 'Internal Page', url: '/about' },
    ];
    
    const { container } = render(<BreadcrumbSchema items={items} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    // 絶対URLはそのまま使用
    expect(data.itemListElement[0].item).toBe('https://example.com');
    // 相対URLはベースURLと結合
    expect(data.itemListElement[1].item).toBe('https://crypto-media.jp/about');
  });

  it('should handle empty items array', () => {
    const { container } = render(<BreadcrumbSchema items={[]} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    expect(data.itemListElement).toEqual([]);
  });

  it('should use default URL when environment variable is not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    
    const items = [
      { name: 'ホーム', url: '/' },
    ];
    
    const { container } = render(<BreadcrumbSchema items={items} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    expect(data.itemListElement[0].item).toBe('https://crypto-media.jp/');
  });

  it('should maintain correct position numbering', () => {
    const items = [
      { name: 'First', url: '/first' },
      { name: 'Second', url: '/second' },
      { name: 'Third', url: '/third' },
      { name: 'Fourth', url: '/fourth' },
    ];
    
    const { container } = render(<BreadcrumbSchema items={items} />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    interface ListItem {
      '@type': string;
      position: number;
      name: string;
      item: string;
    }
    
    data.itemListElement.forEach((item: ListItem, index: number) => {
      expect(item.position).toBe(index + 1);
    });
  });
});