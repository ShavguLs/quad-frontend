import { afterEach, describe, expect, it, vi } from 'vitest';

import worker, {
  buildBookBreadcrumbJsonLd,
  buildBookJsonLd,
  buildBookMetadata,
  buildFallbackMetadata,
  classifyRoute,
  injectMetadata,
  isAssetPath,
  isKnownPrivateSpaRoute,
  isKnownPublicStaticRoute,
  isPrerenderedBookHtml,
  isReaderHost,
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

const notFoundHtml = `
<!DOCTYPE html>
<html lang="ka">
  <head>
    <title>404 | Quaduni</title>
    <meta name="robots" content="noindex,nofollow" />
  </head>
  <body>
    <h1>გვერდი ვერ მოიძებნა</h1>
  </body>
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

  it('classifies public, private, asset, book, and unknown routes centrally', () => {
    expect(classifyRoute('/')).toBe('public');
    expect(classifyRoute('/books')).toBe('public');
    expect(classifyRoute('/login')).toBe('private');
    expect(classifyRoute('/reader/42')).toBe('private');
    expect(classifyRoute('/book/42')).toBe('book');
    expect(classifyRoute('/assets/index.js')).toBe('asset');
    expect(classifyRoute('/favicon.svg')).toBe('asset');
    expect(classifyRoute('/sitemap.xml')).toBe('sitemap');
    expect(classifyRoute('/definitely-not-real')).toBe('unknown');
    expect(isKnownPublicStaticRoute('/books/')).toBe(true);
    expect(isKnownPrivateSpaRoute('/draft/42')).toBe(true);
    expect(isAssetPath('/robots.txt')).toBe(true);
    expect(isReaderHost('reader.quaduni.com')).toBe(true);
    expect(isReaderHost('quaduni.com')).toBe(false);
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

  it('injects metadata for fallback book html when the book exists', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 7,
      title: 'ვეფხისტყაოსანი',
      author: 'შოთა რუსთაველი',
      description: 'ეპიკური პოემა',
      price: '12',
      cover_image_url: '/media/covers/book.png',
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const env = {
      ASSETS: {
        fetch: vi.fn().mockImplementation((request) => {
          const url = new URL(request.url);

          if (url.pathname === '/404.html') {
            return Promise.resolve(new Response(notFoundHtml, {
              headers: { 'content-type': 'text/html; charset=utf-8' },
            }));
          }

          return Promise.resolve(new Response(template, {
            headers: { 'content-type': 'text/html; charset=utf-8' },
          }));
        }),
      },
    };

    const bookResponse = await worker.fetch(new Request('https://quaduni.com/book/7'), env);
    const bookHtml = await bookResponse.text();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(bookResponse.status).toBe(200);
    expect(bookHtml).toContain('content="https://quaduni.com/media/covers/book.png"');
    expect(bookHtml).toContain('data-seo-og-image-alt property="og:image:alt" content="ვეფხისტყაოსანი — გარეკანი"');
    expect(bookHtml).toContain('"@type":"Book"');
    expect(bookHtml).toContain('"@type":"BreadcrumbList"');
  });

  it('returns the prerendered not-found page for unknown routes', async () => {
    const assetsFetch = vi.fn().mockImplementation((request) => {
      const url = new URL(request.url);

      if (url.pathname === '/404.html') {
        return Promise.resolve(new Response(notFoundHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }));
      }

      return Promise.resolve(new Response(template, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }));
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await worker.fetch(new Request('https://quaduni.com/definitely-not-real'), {
      ASSETS: { fetch: assetsFetch },
    });
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title>404 | Quaduni</title>');
    expect(assetsFetch).toHaveBeenCalledTimes(1);
    expect(assetsFetch.mock.calls[0][0].url).toBe('https://quaduni.com/404.html');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('serves the reader app shell for reader subdomain routes', async () => {
    const assetsFetch = vi.fn().mockImplementation((request) => {
      const url = new URL(request.url);

      if (url.pathname === '/') {
        return Promise.resolve(new Response(template, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }));
      }

      if (url.pathname === '/404.html') {
        return Promise.resolve(new Response(notFoundHtml, {
          status: 404,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }));
      }

      return Promise.resolve(new Response('unexpected', { status: 500 }));
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const rootResponse = await worker.fetch(new Request('https://reader.quaduni.com/'), {
      ASSETS: { fetch: assetsFetch },
    });
    const bookResponse = await worker.fetch(new Request('https://reader.quaduni.com/123'), {
      ASSETS: { fetch: assetsFetch },
    });
    const previewResponse = await worker.fetch(new Request('https://reader.quaduni.com/123?preview=1'), {
      ASSETS: { fetch: assetsFetch },
    });

    expect(rootResponse.status).toBe(200);
    expect(bookResponse.status).toBe(200);
    expect(previewResponse.status).toBe(200);
    expect(await bookResponse.text()).toBe(template);
    expect(assetsFetch).toHaveBeenCalledTimes(3);
    expect(assetsFetch.mock.calls.map(([request]) => request.url)).toEqual([
      'https://reader.quaduni.com/',
      'https://reader.quaduni.com/',
      'https://reader.quaduni.com/',
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('serves reader subdomain asset paths directly', async () => {
    const assetsFetch = vi.fn().mockResolvedValue(new Response('console.log("ok");', {
      headers: { 'content-type': 'application/javascript' },
    }));

    const response = await worker.fetch(new Request('https://reader.quaduni.com/assets/index.js'), {
      ASSETS: { fetch: assetsFetch },
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('console.log("ok");');
    expect(assetsFetch).toHaveBeenCalledTimes(1);
    expect(assetsFetch.mock.calls[0][0].url).toBe('https://reader.quaduni.com/assets/index.js');
  });

  it('returns a hard 404 for missing books instead of soft metadata fallback', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchSpy);

    const assetsFetch = vi.fn().mockImplementation((request) => {
      const url = new URL(request.url);

      if (url.pathname === '/404.html') {
        return Promise.resolve(new Response(notFoundHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }));
      }

      return Promise.resolve(new Response(template, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }));
    });

    const response = await worker.fetch(new Request('https://quaduni.com/book/999999'), {
      ASSETS: { fetch: assetsFetch },
    });
    const html = await response.text();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
    expect(assetsFetch).toHaveBeenCalledTimes(2);
    expect(html).toContain('name="robots" content="noindex,nofollow"');
    expect(html).toContain('<title>404 | Quaduni</title>');
    expect(html).not.toContain('application/ld+json');
  });

  it('keeps known public and private spa routes on the asset-serving path', async () => {
    const assetsFetch = vi.fn().mockResolvedValue(new Response(template, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }));
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const publicResponse = await worker.fetch(new Request('https://quaduni.com/books'), {
      ASSETS: { fetch: assetsFetch },
    });
    const privateResponse = await worker.fetch(new Request('https://quaduni.com/login'), {
      ASSETS: { fetch: assetsFetch },
    });

    expect(publicResponse.status).toBe(200);
    expect(privateResponse.status).toBe(200);
    expect(assetsFetch).toHaveBeenCalledTimes(2);
    expect(assetsFetch.mock.calls[0][0].url).toBe('https://quaduni.com/books');
    expect(assetsFetch.mock.calls[1][0].url).toBe('https://quaduni.com/login');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('adds baseline security headers to frontend responses', async () => {
    const assetsFetch = vi.fn().mockResolvedValue(new Response(template, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }));

    const response = await worker.fetch(new Request('https://quaduni.com/books'), {
      ASSETS: { fetch: assetsFetch },
    });

    expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none';");
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin-allow-popups');
  });

  it('still proxies sitemap requests through the worker', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response('<urlset></urlset>', {
      status: 200,
      headers: { 'content-type': 'application/xml' },
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const response = await worker.fetch(new Request('https://quaduni.com/sitemap.xml'), {
      ASSETS: { fetch: vi.fn() },
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.quaduni.com/sitemap.xml');
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
  });
});
