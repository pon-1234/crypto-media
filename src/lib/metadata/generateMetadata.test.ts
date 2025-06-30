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

    expect(metadata.robots?.index).toBe(false);
    expect(metadata.robots?.follow).toBe(false);
    expect(metadata.robots?.googleBot?.index).toBe(false);
    expect(metadata.robots?.googleBot?.follow).toBe(false);
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

    expect(metadata.openGraph?.type).toBe('article');
    expect(metadata.openGraph?.publishedTime).toBe('2024-01-01T00:00:00Z');
    expect(metadata.openGraph?.modifiedTime).toBe('2024-01-02T00:00:00Z');
    expect(metadata.openGraph?.authors).toEqual(['John Doe', 'Jane Smith']);
    expect(metadata.openGraph?.section).toBe('Cryptocurrency');
    expect(metadata.openGraph?.tags).toEqual(['bitcoin', 'analysis', 'investment']);
  });

  it('should include Twitter card metadata', () => {
    const metadata = generatePageMetadata({
      title: 'Twitter Test',
      description: 'Twitter card test',
    });

    expect(metadata.twitter?.card).toBe('summary_large_image');
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
    expect(metadata.openGraph?.type).toBe('website');
  });

  it('should set robot directives', () => {
    const metadata = generatePageMetadata({
      title: 'Robot Test',
      description: 'Robot directives test',
    });

    const robots = metadata.robots;
    expect(typeof robots === 'object' && 'index' in robots && robots.index).toBe(true);
    expect(typeof robots === 'object' && 'follow' in robots && robots.follow).toBe(true);
    expect(typeof robots === 'object' && 'googleBot' in robots && (robots.googleBot as Record<string, unknown>)?.['max-video-preview']).toBe(-1);
    expect(typeof robots === 'object' && 'googleBot' in robots && (robots.googleBot as Record<string, unknown>)?.['max-image-preview']).toBe('large');
    expect(typeof robots === 'object' && 'googleBot' in robots && (robots.googleBot as Record<string, unknown>)?.['max-snippet']).toBe(-1);
  });
});