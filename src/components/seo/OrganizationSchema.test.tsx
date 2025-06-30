import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { OrganizationSchema } from './OrganizationSchema';

describe('OrganizationSchema', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://crypto-media.jp';
  });

  it('should render Organization structured data', () => {
    const { container } = render(<OrganizationSchema />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    
    const data = JSON.parse(script?.innerHTML || '{}');
    expect(data['@type']).toBe('Organization');
    expect(data.name).toBe('Crypto Media');
    expect(data.url).toBe('https://crypto-media.jp');
  });

  it('should include complete organization information', () => {
    const { container } = render(<OrganizationSchema />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    // ロゴ情報の確認
    expect(data.logo).toEqual({
      '@type': 'ImageObject',
      url: 'https://crypto-media.jp/logo.png',
      width: 600,
      height: 60,
    });
    
    // 連絡先情報の確認
    expect(data.contactPoint).toEqual({
      '@type': 'ContactPoint',
      telephone: '+81-3-1234-5678',
      contactType: 'customer service',
      areaServed: 'JP',
      availableLanguage: ['Japanese', 'English'],
    });
    
    // ソーシャルメディアリンクの確認
    expect(data.sameAs).toContain('https://twitter.com/cryptomedia_jp');
    expect(data.sameAs).toContain('https://www.facebook.com/cryptomedia.jp');
    
    // 住所情報の確認
    expect(data.address['@type']).toBe('PostalAddress');
    expect(data.address.addressCountry).toBe('JP');
  });

  it('should include founding information', () => {
    const { container } = render(<OrganizationSchema />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    expect(data.foundingDate).toBe('2024-01-01');
    expect(data.founders).toHaveLength(1);
    expect(data.founders[0]['@type']).toBe('Person');
  });

  it('should include description and slogan', () => {
    const { container } = render(<OrganizationSchema />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    expect(data.description).toContain('仮想通貨・ブロックチェーン');
    expect(data.slogan).toBe('仮想通貨投資を、もっと身近に。');
  });

  it('should use default URL when environment variable is not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    
    const { container } = render(<OrganizationSchema />);
    
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.innerHTML || '{}');
    
    expect(data.url).toBe('https://crypto-media.jp');
    expect(data.logo.url).toBe('https://crypto-media.jp/logo.png');
  });
});