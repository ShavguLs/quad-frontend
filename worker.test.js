import { describe, expect, it } from 'vitest';

import {
  buildBookMetadata,
  buildFallbackMetadata,
  injectMetadata,
  matchBookPath,
} from './worker.js';

const template = `
<!DOCTYPE html>
<html lang="ka">
  <head>
    <title data-seo-title>Default</title>
    <meta data-seo-description name="description" content="Default description" />
    <meta data-seo-robots name="robots" content="index,follow" />
    <link data-seo-canonical rel="canonical" href="https://quaduni.com/" />
    <meta data-seo-og-title property="og:title" content="Default" />
    <meta data-seo-og-description property="og:description" content="Default description" />
    <meta data-seo-og-type property="og:type" content="website" />
    <meta data-seo-og-image property="og:image" content="https://cdn-icons-png.flaticon.com/512/14931/14931711.png" />
    <meta data-seo-og-url property="og:url" content="https://quaduni.com/" />
    <meta data-seo-twitter-title name="twitter:title" content="Default" />
    <meta data-seo-twitter-description name="twitter:description" content="Default description" />
    <meta data-seo-twitter-image name="twitter:image" content="https://cdn-icons-png.flaticon.com/512/14931/14931711.png" />
  </head>
</html>
`;

describe('worker book metadata helpers', () => {
  it('matches public book detail routes only', () => {
    expect(matchBookPath('/book/42')).toBe('42');
    expect(matchBookPath('/book/42/')).toBe('42');
    expect(matchBookPath('/book/42/read')).toBeNull();
    expect(matchBookPath('/catalog')).toBeNull();
  });

  it('builds book-specific metadata from public book data', () => {
    const metadata = buildBookMetadata({
      id: 7,
      title: 'ვეფხისტყაოსანი',
      author: 'შოთა რუსთაველი',
      description: '  ეპიკური   პოემა ',
      cover_image_url: 'https://api.quaduni.com/media/covers/book.png',
    }, '/book/7');

    expect(metadata.title).toBe('ვეფხისტყაოსანი — შოთა რუსთაველი | Quaduni');
    expect(metadata.description).toBe('ეპიკური პოემა');
    expect(metadata.canonical).toBe('https://quaduni.com/book/7');
    expect(metadata.ogImage).toBe('https://api.quaduni.com/media/covers/book.png');
    expect(metadata.ogType).toBe('book');
    expect(metadata.robots).toBe('index,follow');
  });

  it('uses a safe fallback for missing books', () => {
    const metadata = buildFallbackMetadata('/book/999999');

    expect(metadata.title).toBe('წიგნი ვერ მოიძებნა | Quaduni');
    expect(metadata.canonical).toBe('https://quaduni.com/book/999999');
    expect(metadata.robots).toBe('noindex,nofollow');
  });

  it('injects crawler-visible metadata into the raw html document', () => {
    const metadata = buildBookMetadata({
      id: 11,
      title: 'დიდოსტატის მარჯვენა',
      author: 'კონსტანტინე გამსახურდია',
      description: 'ისტორიული რომანი',
      cover_image_url: 'https://api.quaduni.com/media/covers/master-hand.png',
    }, '/book/11');

    const result = injectMetadata(template, metadata);

    expect(result).toContain('<title data-seo-title>დიდოსტატის მარჯვენა — კონსტანტინე გამსახურდია | Quaduni</title>');
    expect(result).toContain('data-seo-canonical rel="canonical" href="https://quaduni.com/book/11"');
    expect(result).toContain('data-seo-og-image property="og:image" content="https://api.quaduni.com/media/covers/master-hand.png"');
    expect(result).toContain('data-seo-twitter-description name="twitter:description" content="ისტორიული რომანი"');
  });
});
