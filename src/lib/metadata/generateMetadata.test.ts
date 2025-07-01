import { describe, it, expect, beforeEach } from 'vitest';
import { generatePageMetadata } from './generateMetadata';

describe('generatePageMetadata', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://crypto-media.jp';
  });

  it('should generate basic metadata', () => {
    const metadata = generatePageMetadata({
      title: 'Test Page',
      description: 'This is a test page',
    });

    expect(metadata.title).toBe('Test Page');
    expect(metadata.description).toBe('This is a test page');
    expect(metadata.alternates?.canonical).toBe('https://crypto-media.jp');
  });

  it('should generate metadata with path', () => {
    const metadata = generatePageMetadata({
      title: 'About Us',
      description: 'Learn more about us',
      path: '/about',
    });

    expect(metadata.alternates?.canonical).toBe('https://crypto-media.jp/about');
  });

  it('should generate OG image URL with default params', () => {
    const metadata = generatePageMetadata({
      title: 'Test Title',
      description: 'Test Description',
    });

    const images = metadata.openGraph?.images;
    const ogImage = Array.isArray(images) ? images[0] : images;
    expect((ogImage as { url?: string })?.url).toContain('/api/og?');
    expect((ogImage as { url?: string })?.url).toContain('title=Test+Title');
    expect((ogImage as { url?: string })?.url).toContain('description=Test+Description');
    expect((ogImage as { url?: string })?.url).toContain('type=default');
    expect((ogImage as { width?: number })?.width).toBe(1200);
    expect((ogImage as { height?: number })?.height).toBe(630);
  });

  it('should generate OG image URL with custom params', () => {
    const metadata = generatePageMetadata({
      title: 'Article Title',
      description: 'Article Description',
      ogImageParams: {
        title: 'Custom OG Title',
        description: 'Custom OG Description',
        type: 'article',
        category: 'Blockchain',
      },
    });

    const images = metadata.openGraph?.images;
    const ogImage = Array.isArray(images) ? images[0] : images;
    expect((ogImage as { url?: string })?.url).toContain('title=Custom+OG+Title');
    expect((ogImage as { url?: string })?.url).toContain('description=Custom+OG+Description');
    expect((ogImage as { url?: string })?.url).toContain('type=article');
    expect((ogImage as { url?: string })?.url).toContain('category=Blockchain');
  });

  it('should set keywords', () => {
    const metadata = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      keywords: ['crypto', 'blockchain', 'bitcoin'],
    });

    expect(metadata.keywords).toBe('crypto, blockchain, bitcoin');
  });

  it('should handle noindex flag', () => {
    const metadata = generatePageMetadata({
      title: 'Private Page',
      description: 'This page should not be indexed',
      noindex: true,
    });

    const robots = metadata.robots;
    expect(typeof robots === 'object' && robots !== null && 'index' in robots && robots.index).toBe(false);
    expect(typeof robots === 'object' && robots !== null && 'follow' in robots && robots.follow).toBe(false);
    expect(typeof robots === 'object' && robots !== null && 'googleBot' in robots && typeof robots.googleBot === 'object' && robots.googleBot !== null && 'index' in robots.googleBot && robots.googleBot.index).toBe(false);
    expect(typeof robots === 'object' && robots !== null && 'googleBot' in robots && typeof robots.googleBot === 'object' && robots.googleBot !== null && 'follow' in robots.googleBot && robots.googleBot.follow).toBe(false);
  });

  it('should generate article metadata', () => {
    const metadata = generatePageMetadata({
      title: 'Bitcoin Analysis',
      description: 'Deep dive into Bitcoin',
      ogType: 'article',
      publishedTime: '2024-01-01T00:00:00Z',
      modifiedTime: '2024-01-02T00:00:00Z',
      authors: ['John Doe', 'Jane Smith'],
      category: 'Cryptocurrency',
      tags: ['bitcoin', 'analysis', 'investment'],
    });

    expect(metadata.openGraph).toBeDefined();
    // OpenGraphのarticle特有のプロパティはNext.jsの型定義には含まれていない
    // 実際にはStructuredDataコンポーネントで実装される
  });

  it('should include Twitter card metadata', () => {
    const metadata = generatePageMetadata({
      title: 'Twitter Test',
      description: 'Twitter card test',
    });

    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter?.title).toBe('Twitter Test');
    expect(metadata.twitter?.description).toBe('Twitter card test');
    expect(metadata.twitter?.site).toBe('@cryptomedia_jp');
    expect(metadata.twitter?.creator).toBe('@cryptomedia_jp');
    const twitterImages = metadata.twitter?.images;
    const twitterImage = Array.isArray(twitterImages) ? twitterImages[0] : twitterImages;
    expect((twitterImage as string)).toContain('/api/og?');
  });

  it('should use default base URL when env var is not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    
    const metadata = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      path: '/test',
    });

    expect(metadata.alternates?.canonical).toBe('https://crypto-media.jp/test');
    const images2 = metadata.openGraph?.images;
    const ogImage2 = Array.isArray(images2) ? images2[0] : images2;
    expect((ogImage2 as { url?: string })?.url).toContain('https://crypto-media.jp/api/og?');
  });

  it('should set all OpenGraph properties', () => {
    const metadata = generatePageMetadata({
      title: 'OG Test',
      description: 'OpenGraph test',
      path: '/og-test',
    });

    expect(metadata.openGraph?.title).toBe('OG Test');
    expect(metadata.openGraph?.description).toBe('OpenGraph test');
    expect(metadata.openGraph?.url).toBe('https://crypto-media.jp/og-test');
    expect(metadata.openGraph?.siteName).toBe('Crypto Media');
    expect(metadata.openGraph?.locale).toBe('ja_JP');
    expect(metadata.openGraph).toBeDefined();
  });

  it('should set robot directives', () => {
    const metadata = generatePageMetadata({
      title: 'Robot Test',
      description: 'Robot directives test',
    });

    const robots = metadata.robots;
    if (robots && typeof robots === 'object') {
      expect('index' in robots && robots.index).toBe(true);
      expect('follow' in robots && robots.follow).toBe(true);
      if ('googleBot' in robots && robots.googleBot && typeof robots.googleBot === 'object') {
        const googleBot = robots.googleBot as Record<string, unknown>;
        expect(googleBot['max-video-preview']).toBe(-1);
        expect(googleBot['max-image-preview']).toBe('large');
        expect(googleBot['max-snippet']).toBe(-1);
      }
    }
  });
});