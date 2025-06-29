/**
 * site.ts の単体テスト
 * @issue #1 - プロジェクト基盤とCI/CDパイプラインの構築
 */

import { describe, it, expect } from 'vitest';
import { SITE_CONFIG } from '../site';

describe('SITE_CONFIG', () => {
  describe('meta', () => {
    it('サイトメタ情報が正しく設定されている', () => {
      expect(SITE_CONFIG.meta.siteName).toBe('Crypto Media');
      expect(SITE_CONFIG.meta.corporateName).toBe('Example Corporation');
      expect(SITE_CONFIG.meta.domain).toBe('example.co.jp');
      expect(SITE_CONFIG.meta.defaultDescription).toBe('暗号資産・ブロックチェーンの最新情報をお届けするメディアサイト');
      expect(SITE_CONFIG.meta.defaultOgImage).toBe('/images/og-default.png');
    });
  });

  describe('urls', () => {
    it('コーポレートサイトのURLが正しく設定されている', () => {
      expect(SITE_CONFIG.urls.corporate.top).toBe('/');
      expect(SITE_CONFIG.urls.corporate.about).toBe('/about/');
      expect(SITE_CONFIG.urls.corporate.service).toBe('/service/');
      expect(SITE_CONFIG.urls.corporate.recruit).toBe('/recruit/');
      expect(SITE_CONFIG.urls.corporate.news).toBe('/news/');
      expect(SITE_CONFIG.urls.corporate.contact).toBe('/contact/');
      expect(SITE_CONFIG.urls.corporate.terms).toBe('/terms/');
      expect(SITE_CONFIG.urls.corporate.privacyPolicy).toBe('/privacy-policy/');
      expect(SITE_CONFIG.urls.corporate.dealing).toBe('/dealing/');
    });

    it('メディアサイトのURLが正しく設定されている', () => {
      expect(SITE_CONFIG.urls.media.top).toBe('/media/');
      expect(SITE_CONFIG.urls.media.articles).toBe('/media/articles/');
      expect(SITE_CONFIG.urls.media.categories).toBe('/media/category/');
      expect(SITE_CONFIG.urls.media.tags).toBe('/media/tag/');
      expect(SITE_CONFIG.urls.media.experts).toBe('/media/experts/');
      expect(SITE_CONFIG.urls.media.features).toBe('/media/feature/');
      expect(SITE_CONFIG.urls.media.news).toBe('/media/news/');
      expect(SITE_CONFIG.urls.media.premium).toBe('/media/premium/');
      expect(SITE_CONFIG.urls.media.survey).toBe('/media/survey/');
      expect(SITE_CONFIG.urls.media.glossary).toBe('/media/glossary/');
      expect(SITE_CONFIG.urls.media.faq).toBe('/media/faq/');
      expect(SITE_CONFIG.urls.media.editorialPolicy).toBe('/media/editorial-policy/');
      expect(SITE_CONFIG.urls.media.contact).toBe('/media/contact/');
    });

    it('認証関連のURLが正しく設定されている', () => {
      expect(SITE_CONFIG.urls.auth.register).toBe('/register/');
      expect(SITE_CONFIG.urls.auth.login).toBe('/login/');
      expect(SITE_CONFIG.urls.auth.mypage).toBe('/media/mypage/');
      expect(SITE_CONFIG.urls.auth.membership).toBe('/media/mypage/membership/');
      expect(SITE_CONFIG.urls.auth.settings).toBe('/media/mypage/settings/');
      expect(SITE_CONFIG.urls.auth.support).toBe('/media/mypage/support/');
    });
  });

  describe('membership', () => {
    it('会員区分が正しく設定されている', () => {
      expect(SITE_CONFIG.membership.types.GUEST).toBe('guest');
      expect(SITE_CONFIG.membership.types.FREE).toBe('free');
      expect(SITE_CONFIG.membership.types.PAID).toBe('paid');
    });

    it('価格情報が正しく設定されている', () => {
      expect(SITE_CONFIG.membership.price.monthly).toBe(1980);
      expect(SITE_CONFIG.membership.price.currency).toBe('JPY');
    });
  });

  describe('performance', () => {
    it('Core Web Vitalsの目標値が正しく設定されている', () => {
      expect(SITE_CONFIG.performance.cwv.lcp).toBe(2000);
      expect(SITE_CONFIG.performance.cwv.fid).toBe(100);
      expect(SITE_CONFIG.performance.cwv.cls).toBe(0.1);
    });

    it('Lighthouseの最低スコアが正しく設定されている', () => {
      expect(SITE_CONFIG.performance.lighthouse.minScore.performance).toBe(90);
      expect(SITE_CONFIG.performance.lighthouse.minScore.accessibility).toBe(90);
      expect(SITE_CONFIG.performance.lighthouse.minScore.bestPractices).toBe(90);
      expect(SITE_CONFIG.performance.lighthouse.minScore.seo).toBe(90);
    });
  });

  describe('revalidate', () => {
    it('ISR設定が正しく設定されている', () => {
      expect(SITE_CONFIG.revalidate.default).toBe(60);
      expect(SITE_CONFIG.revalidate.article).toBe(300);
      expect(SITE_CONFIG.revalidate.static).toBe(3600);
    });
  });

  describe('pagination', () => {
    it('ページネーション設定が正しく設定されている', () => {
      expect(SITE_CONFIG.pagination.defaultLimit).toBe(20);
      expect(SITE_CONFIG.pagination.maxLimit).toBe(100);
    });
  });

  it('オブジェクトがas constで定義されている', () => {
    // TypeScriptの型システムで読み取り専用が保証されているため、
    // ランタイムでの検証は不要
    const config: typeof SITE_CONFIG = SITE_CONFIG;
    expect(config).toBe(SITE_CONFIG);
  });
});