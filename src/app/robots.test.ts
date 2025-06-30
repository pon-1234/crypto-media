import { describe, it, expect, beforeEach } from 'vitest';
import robots from './robots';

describe('Robots.txt Generation', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://crypto-media.jp';
  });

  it('should generate robots.txt with correct structure', () => {
    const result = robots();

    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('sitemap');
    expect(result).toHaveProperty('host');
    expect(result.sitemap).toBe('https://crypto-media.jp/sitemap.xml');
    expect(result.host).toBe('https://crypto-media.jp');
  });

  it('should include rules for all user agents', () => {
    const result = robots();
    
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const allRule = rules.find((rule) => rule.userAgent === '*');
    expect(allRule).toBeDefined();
    expect(allRule?.allow).toBe('/');
    expect(allRule?.disallow).toContain('/api/');
    expect(allRule?.disallow).toContain('/media/mypage/');
    expect(allRule?.disallow).toContain('/_next/');
    expect(allRule?.disallow).toContain('/static/');
    expect(allRule?.disallow).toContain('/*.json$');
  });

  it('should include specific rules for major search engines', () => {
    const result = robots();
    
    const searchEngines = ['Googlebot', 'bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot'];
    
    searchEngines.forEach(bot => {
      const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
      const rule = rules.find((r) => r.userAgent === bot);
      expect(rule).toBeDefined();
      expect(rule?.allow).toBe('/');
      expect(rule?.disallow).toContain('/api/');
      expect(rule?.disallow).toContain('/media/mypage/');
    });
  });

  it('should block malicious bots', () => {
    const result = robots();
    
    const maliciousBots = ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot'];
    
    maliciousBots.forEach(bot => {
      const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
      const rule = rules.find((r) => r.userAgent === bot);
      expect(rule).toBeDefined();
      expect(rule?.disallow).toBe('/');
      expect(rule?.allow).toBeUndefined();
    });
  });

  it('should use default base URL when environment variable is not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    
    const result = robots();
    
    expect(result.sitemap).toBe('https://crypto-media.jp/sitemap.xml');
    expect(result.host).toBe('https://crypto-media.jp');
  });

  it('should use custom base URL from environment variable', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
    
    const result = robots();
    
    expect(result.sitemap).toBe('https://example.com/sitemap.xml');
    expect(result.host).toBe('https://example.com');
  });

  it('should have correct number of rules', () => {
    const result = robots();
    
    // 1 rule for *, 6 rules for major search engines, 4 rules for malicious bots
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    expect(rules.length).toBe(11);
  });

  it('should protect sensitive paths for all bots', () => {
    const result = robots();
    
    const sensitivePaths = ['/api/', '/media/mypage/'];
    
    // Check that all non-malicious bots have these paths in disallow
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    rules.forEach((rule) => {
      if (rule.userAgent !== 'AhrefsBot' && 
          rule.userAgent !== 'SemrushBot' && 
          rule.userAgent !== 'MJ12bot' && 
          rule.userAgent !== 'DotBot') {
        sensitivePaths.forEach(path => {
          expect(rule.disallow).toContain(path);
        });
      }
    });
  });
});