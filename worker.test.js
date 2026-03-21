import { afterEach, describe, expect, it, vi } from 'vitest';

import worker, {
  buildBookBreadcrumbJsonLd,
  buildBookJsonLd,
  buildBookMetadata,
  buildFallbackMetadata,
  injectMetadata,
  isPrerenderedBookHtml,
  matchBookPath,
} from './worker.js';

const template = `
<!DOCTYPE html>
<html lang="ka">
  <head>
    <title data-seo-title>Quaduni — ციფრული წიგნების მაღაზია</title>
    <meta data-seo-description name="description" content="Quaduni — ქართული ციფრული წიგნების მაღაზია. იყიდე, წაიკითხე და გამოაქვეყნე წიგნები ონლაინ." />
    <meta data-seo-robots name="robots" content="index,follow" />
    <link data-seo-canonical rel="canonical" href="https://quaduni.com/" />
    <meta data-seo-og-title property="og:title" content="Quaduni — ციფრული წიგნების მაღაზია" />
    <meta data-seo-og-description property="og:description" content="Quaduni — ქართული ციფრული წიგნების მაღაზია. იყიდე, წაიკითხე და გამოაქვეყნე წიგნები ონლაინ." />
    <meta data-seo-og-type property="og:type" content="website" />
    <meta data-seo-og-image property="og:image" content="https://quaduni.com/og-default.png" />
    <meta data-seo-og-image-alt property="og:image:alt" content="Quaduni — ციფრული წიგნების პლატფორმა" />
    <meta data-seo-og-url property="og:url" content="https://quaduni.com/" />
    <meta data-seo-twitter-title name="twitter:title" content="Quaduni — ციფრული წიგნების მაღაზია" />
    <meta data-seo-twitter-description name="twitter:description" content="Quaduni — ქართული ციფრული წიგნების მაღაზია. იყიდე, წაიკითხე და გამოაქვეყნე წიგნები ონლაინ." />
    <meta data-seo-twitter-image name="twitter:image" content="https://quaduni.com/og-default.png" />
    <meta data-seo-twitter-image-alt name="twitter:image:alt" content="Quaduni — ციფრული წიგნების პლატფორმა" />
  </head>
</html>
`;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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
    expect(metadata.ogImageAlt).toBe('ვეფხისტყაოსანი — გარეკანი');
    expect(metadata.twitterImageAlt).toBe('ვეფხისტყაოსანი — გარეკანი');
    expect(metadata.ogType).toBe('book');
    expect(metadata.robots).toBe('index,follow');
  });

  it('resolves relative fallback cover images to the site url for prerender parity', () => {
    const metadata = buildBookMetadata({
      id: 8,
      title: 'გველის პერანგი',
      author: 'გრიგოლ რობაქიძე',
      cover_image_url: '/media/covers/book-8.png',
    }, '/book/8');

    const bookJsonLd = buildBookJsonLd({
      id: 8,
      title: 'გველის პერანგი',
      author: 'გრიგოლ რობაქიძე',
      cover_image_url: '/media/covers/book-8.png',
    }, '/book/8');

    expect(metadata.ogImage).toBe('https://quaduni.com/media/covers/book-8.png');
    expect(metadata.twitterImage).toBe('https://quaduni.com/media/covers/book-8.png');
    expect(bookJsonLd.image).toBe('https://quaduni.com/media/covers/book-8.png');
  });

  it('builds book schema and breadcrumbs with prerender parity', () => {
    const book = {
      id: 7,
      title: 'ვეფხისტყაოსანი',
      author: 'შოთა რუსთაველი',
      description: 'ეპიკური პოემა',
      price: '₾ 12.50',
      cover_image_url: '/media/covers/book.png',
      created_at: '2026-03-01',
      updated_at: '2026-03-10',
    };

    const bookJsonLd = buildBookJsonLd(book, '/book/7');
    const breadcrumbJsonLd = buildBookBreadcrumbJsonLd(book, '/book/7');

    expect(bookJsonLd.image).toBe('https://quaduni.com/media/covers/book.png');
    expect(bookJsonLd.offers.price).toBe('12.50');
    expect(bookJsonLd.datePublished).toBe('2026-03-01');
    expect(breadcrumbJsonLd.itemListElement[2].item).toBe('https://quaduni.com/book/7');
  });

  it('uses a safe fallback for missing books', () => {
    const metadata = buildFallbackMetadata('/book/999999');

    expect(metadata.title).toBe('წიგნი ვერ მოიძებნა | Quaduni');
    expect(metadata.canonical).toBe('https://quaduni.com/book/999999');
    expect(metadata.robots).toBe('noindex,nofollow');
  });

  it('detects prerendered book html separately from the generic shell', () => {
    const book = {
      id: 11,
      title: 'დიდოსტატის მარჯვენა',
      author: 'კონსტანტინე გამსახურდია',
      description: 'ისტორიული რომანი',
      price: '15',
      cover_image_url: 'https://api.quaduni.com/media/covers/master-hand.png',
    };
    const prerenderedHtml = injectMetadata(template, {
      ...buildBookMetadata(book, '/book/11'),
      jsonLd: [buildBookJsonLd(book, '/book/11')],
    });

    expect(isPrerenderedBookHtml(template, '/book/11')).toBe(false);
    expect(isPrerenderedBookHtml(prerenderedHtml, '/book/11')).toBe(true);
  });

  it('injects crawler-visible metadata and schema into the raw html document', () => {
    const book = {
      id: 11,
      title: 'დიდოსტატის მარჯვენა',
      author: 'კონსტანტინე გამსახურდია',
      description: 'ისტორიული რომანი',
      price: '15',
      cover_image_url: 'https://api.quaduni.com/media/covers/master-hand.png',
    };
    const metadata = {
      ...buildBookMetadata(book, '/book/11'),
      jsonLd: [buildBookJsonLd(book, '/book/11'), buildBookBreadcrumbJsonLd(book, '/book/11')],
    };

    const result = injectMetadata(template, metadata);

    expect(result).toContain('<title data-seo-title>დიდოსტატის მარჯვენა — კონსტანტინე გამსახურდია | Quaduni</title>');
    expect(result).toContain('data-seo-canonical rel="canonical" href="https://quaduni.com/book/11"');
    expect(result).toContain('data-seo-og-image property="og:image" content="https://api.quaduni.com/media/covers/master-hand.png"');
    expect(result).toContain('data-seo-og-image-alt property="og:image:alt" content="დიდოსტატის მარჯვენა — გარეკანი"');
    expect(result).toContain('data-seo-twitter-description name="twitter:description" content="ისტორიული რომანი"');
    expect(result).toContain('data-seo-twitter-image-alt name="twitter:image:alt" content="დიდოსტატის მარჯვენა — გარეკანი"');
    expect(result).toContain('<script type="application/ld+json">{"@context":"https://schema.org","@type":"Book"');
    expect(result).toContain('<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"');
  });

  it('returns prerendered book html unchanged without calling the book api', async () => {
    const book = {
      id: 7,
      title: 'ვეფხისტყაოსანი',
      author: 'შოთა რუსთაველი',
      description: 'ეპიკური პოემა',
      price: '12',
      cover_image_url: 'https://api.quaduni.com/media/covers/book.png',
    };
    const prerenderedHtml = injectMetadata(template, {
      ...buildBookMetadata(book, '/book/7'),
      jsonLd: [buildBookJsonLd(book, '/book/7')],
    });

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await worker.fetch(new Request('https://quaduni.com/book/7'), {
      ASSETS: {
        fetch: vi.fn().mockResolvedValue(new Response(prerenderedHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })),
      },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await response.text()).toBe(prerenderedHtml);
  });

  it('injects metadata for fallback book html and preserves safe noindex for missing books', async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 7,
        title: 'ვეფხისტყაოსანი',
        author: 'შოთა რუსთაველი',
        description: 'ეპიკური პოემა',
        price: '12',
        cover_image_url: '/media/covers/book.png',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchSpy);

    const env = {
      ASSETS: {
        fetch: vi.fn().mockImplementation(() => Promise.resolve(new Response(template, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }))),
      },
    };

    const bookResponse = await worker.fetch(new Request('https://quaduni.com/book/7'), env);
    const bookHtml = await bookResponse.text();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(bookHtml).toContain('content="https://quaduni.com/media/covers/book.png"');
    expect(bookHtml).toContain('data-seo-og-image-alt property="og:image:alt" content="ვეფხისტყაოსანი — გარეკანი"');
    expect(bookHtml).toContain('"@type":"Book"');
    expect(bookHtml).toContain('"@type":"BreadcrumbList"');

    const missingResponse = await worker.fetch(new Request('https://quaduni.com/book/999999'), env);
    const missingHtml = await missingResponse.text();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(missingHtml).toContain('name="robots" content="noindex,nofollow"');
    expect(missingHtml).not.toContain('application/ld+json');
  });
});
