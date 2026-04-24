const DEFAULT_SITEMAP_URL = 'https://api.quaduni.com/sitemap.xml';
const DEFAULT_BOOK_API_BASE_URL = 'https://api.quaduni.com';
const SITE_URL = 'https://quaduni.com';
const DEFAULT_SHELL_TITLE = 'Quaduni — ციფრული წიგნების მაღაზია';
const DEFAULT_SHELL_CANONICAL = `${SITE_URL}/`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const DEFAULT_OG_IMAGE_ALT = 'Quaduni — ციფრული წიგნების პლატფორმა';
const KNOWN_PUBLIC_STATIC_ROUTES = new Set(['/', '/books', '/community', '/reviews', '/terms']);
const KNOWN_PRIVATE_STATIC_ROUTES = new Set([
  '/login',
  '/register',
  '/profile',
  '/wallet',
  '/upload',
  '/library',
  '/my-books',
]);
const PRIVATE_DYNAMIC_ROUTE_PATTERNS = [/^\/reader\/[^/]+\/?$/, /^\/draft\/[^/]+\/?$/];
const FILE_EXTENSION_PATTERN = /\/[^/]+\.[a-z0-9]+$/i;
const CONTENT_SECURITY_POLICY = "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none';";

function getSitemapUrl(env) {
  return env.SITEMAP_PROXY_URL || DEFAULT_SITEMAP_URL;
}

function getBookApiBaseUrl(env) {
  return (env.BOOK_API_BASE_URL || DEFAULT_BOOK_API_BASE_URL).replace(/\/+$/, '');
}

function matchBookPath(pathname) {
  const match = pathname.match(/^\/book\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function normalizeRoutePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }

  return pathname;
}

function isAssetPath(pathname) {
  return FILE_EXTENSION_PATTERN.test(pathname);
}

function isKnownPublicStaticRoute(pathname) {
  return KNOWN_PUBLIC_STATIC_ROUTES.has(normalizeRoutePath(pathname));
}

function isKnownPrivateSpaRoute(pathname) {
  const normalizedPath = normalizeRoutePath(pathname);

  if (KNOWN_PRIVATE_STATIC_ROUTES.has(normalizedPath)) {
    return true;
  }

  return PRIVATE_DYNAMIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function classifyRoute(pathname) {
  if (pathname === '/sitemap.xml') {
    return 'sitemap';
  }

  if (isAssetPath(pathname)) {
    return 'asset';
  }

  if (matchBookPath(pathname)) {
    return 'book';
  }

  if (isKnownPublicStaticRoute(pathname)) {
    return 'public';
  }

  if (isKnownPrivateSpaRoute(pathname)) {
    return 'private';
  }

  return 'unknown';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeDescription(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function toAbsoluteUrl(value, baseUrl = SITE_URL) {
  if (!value) {
    return DEFAULT_OG_IMAGE;
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  return new URL(value, baseUrl).toString();
}

function buildFallbackMetadata(pathname) {
  const canonical = new URL(pathname, SITE_URL).toString();
  const title = 'წიგნი ვერ მოიძებნა | Quaduni';
  const description = 'მოთხოვნილი წიგნის გვერდი ამჟამად მიუწვდომელია Quaduni-ზე.';

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    ogUrl: canonical,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
    twitterImageAlt: DEFAULT_OG_IMAGE_ALT,
    ogType: 'website',
    robots: 'noindex,nofollow',
  };
}

function normalizePriceValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const cleanedValue = trimmedValue.replace(/[^\d.,-]/g, '');
  if (!cleanedValue) {
    return undefined;
  }

  const normalizedValue = cleanedValue.includes(',') && !cleanedValue.includes('.')
    ? cleanedValue.replace(',', '.')
    : cleanedValue.replace(/,/g, '');

  return Number.isFinite(Number.parseFloat(normalizedValue)) ? normalizedValue : undefined;
}

function buildBookMetadata(book, pathname) {
  const canonical = new URL(pathname, SITE_URL).toString();
  const title = `${book.title} — ${book.author} | Quaduni`;
  const description = normalizeDescription(
    book.description,
    `${book.title} — ${book.author}-ის წიგნი Quaduni-ზე`
  );
  const image = toAbsoluteUrl(book.cover_image_url || book.coverUrl || book.img);

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogImageAlt: `${book.title} — გარეკანი`,
    ogUrl: canonical,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    twitterImageAlt: `${book.title} — გარეკანი`,
    ogType: 'book',
    robots: 'index,follow',
  };
}

function buildBookJsonLd(book, pathname) {
  const canonical = new URL(pathname, SITE_URL).toString();
  const price = normalizePriceValue(book.price);
  const image = toAbsoluteUrl(book.cover_image_url || book.coverUrl || book.img);

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    url: canonical,
    inLanguage: 'ka',
    author: {
      '@type': 'Person',
      name: book.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Quaduni',
      url: SITE_URL,
    },
    bookFormat: 'https://schema.org/EBook',
    image,
    ...(book.description ? { description: book.description } : {}),
    ...(book.created_at || book.createdAt
      ? { datePublished: book.created_at || book.createdAt }
      : {}),
    ...(book.updated_at ? { dateModified: book.updated_at } : {}),
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: 'GEL',
            url: canonical,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}

function buildBookBreadcrumbJsonLd(book, pathname) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'მთავარი',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'წიგნები',
        item: new URL('/books', SITE_URL).toString(),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: book.title,
        item: new URL(pathname, SITE_URL).toString(),
      },
    ],
  };
}

function replaceTitle(documentHtml, marker, value) {
  return documentHtml.replace(
    new RegExp(`(<title[^>]*${marker}[^>]*>)([\\s\\S]*?)(<\\/title>)`, 'i'),
    `$1${escapeHtml(value)}$3`
  );
}

function replaceTagAttribute(documentHtml, marker, attributeName, value) {
  return documentHtml.replace(
    new RegExp(`(<(?:meta|link)[^>]*${marker}[^>]*\\b${attributeName}=")(.*?)(")`, 'i'),
    `$1${escapeHtml(value)}$3`
  );
}

function extractMarkedTitle(documentHtml) {
  const match = documentHtml.match(/<title[^>]*data-seo-title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractTagAttribute(documentHtml, marker, attributeName) {
  const match = documentHtml.match(
    new RegExp(`<(?:meta|link)[^>]*${marker}[^>]*\\b${attributeName}="([^"]*)"`, 'i')
  );
  return match ? match[1] : null;
}

function isPrerenderedBookHtml(documentHtml, pathname) {
  const title = extractMarkedTitle(documentHtml);
  const canonical = extractTagAttribute(documentHtml, 'data-seo-canonical', 'href');
  const expectedCanonical = new URL(pathname, SITE_URL).toString();

  if (canonical === expectedCanonical) {
    return true;
  }

  return Boolean(title && title !== DEFAULT_SHELL_TITLE && canonical !== DEFAULT_SHELL_CANONICAL);
}

function injectJsonLd(documentHtml, blocks) {
  const normalizedBlocks = Array.isArray(blocks) ? blocks : blocks ? [blocks] : [];
  let html = documentHtml.replace(/\s*<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');

  if (normalizedBlocks.length === 0) {
    return html;
  }

  const scripts = normalizedBlocks
    .map((block) => `    <script type="application/ld+json">${JSON.stringify(block)}</script>`)
    .join('\n');

  return html.replace('</head>', `${scripts}\n  </head>`);
}

function injectMetadata(documentHtml, metadata) {
  let html = documentHtml;
  html = replaceTitle(html, 'data-seo-title', metadata.title);
  html = replaceTagAttribute(html, 'data-seo-description', 'content', metadata.description);
  html = replaceTagAttribute(html, 'data-seo-robots', 'content', metadata.robots);
  html = replaceTagAttribute(html, 'data-seo-canonical', 'href', metadata.canonical);
  html = replaceTagAttribute(html, 'data-seo-og-title', 'content', metadata.ogTitle);
  html = replaceTagAttribute(html, 'data-seo-og-description', 'content', metadata.ogDescription);
  html = replaceTagAttribute(html, 'data-seo-og-type', 'content', metadata.ogType);
  html = replaceTagAttribute(html, 'data-seo-og-image', 'content', metadata.ogImage);
  html = replaceTagAttribute(html, 'data-seo-og-image-alt', 'content', metadata.ogImageAlt);
  html = replaceTagAttribute(html, 'data-seo-og-url', 'content', metadata.ogUrl);
  html = replaceTagAttribute(html, 'data-seo-twitter-title', 'content', metadata.twitterTitle);
  html = replaceTagAttribute(html, 'data-seo-twitter-description', 'content', metadata.twitterDescription);
  html = replaceTagAttribute(html, 'data-seo-twitter-image', 'content', metadata.twitterImage);
  html = replaceTagAttribute(html, 'data-seo-twitter-image-alt', 'content', metadata.twitterImageAlt);
  return injectJsonLd(html, metadata.jsonLd);
}

async function proxySitemap(request, env) {
  const response = await fetch(getSitemapUrl(env), {
    headers: {
      Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  });

  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/xml; charset=utf-8');
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=300');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fetchBookData(bookId, env) {
  const response = await fetch(`${getBookApiBaseUrl(env)}/books/${encodeURIComponent(bookId)}/`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function isHtmlResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html');
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function renderNotFoundPage(request, env) {
  const notFoundRequest = new Request(new URL('/404.html', request.url), request);
  const notFoundResponse = await env.ASSETS.fetch(notFoundRequest);
  const headers = new Headers(notFoundResponse.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  if (!notFoundResponse.ok || !isHtmlResponse(notFoundResponse)) {
    return new Response('<!DOCTYPE html><html lang="ka"><head><meta charset="utf-8" /><meta name="robots" content="noindex,nofollow" /><title>404 | Quaduni</title></head><body><h1>404</h1></body></html>', {
      status: 404,
      headers,
    });
  }

  return new Response(await notFoundResponse.text(), {
    status: 404,
    statusText: 'Not Found',
    headers,
  });
}

async function injectBookPageMetadata(request, env) {
  const url = new URL(request.url);
  const bookId = matchBookPath(url.pathname);
  if (!bookId) {
    return env.ASSETS.fetch(request);
  }

  const assetResponse = await env.ASSETS.fetch(request);
  if (!assetResponse.ok || !isHtmlResponse(assetResponse)) {
    return assetResponse;
  }

  const assetHtml = await assetResponse.text();
  if (isPrerenderedBookHtml(assetHtml, url.pathname)) {
    const headers = new Headers(assetResponse.headers);
    headers.set('content-type', 'text/html; charset=utf-8');

    return withSecurityHeaders(new Response(assetHtml, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    }));
  }

  const book = await fetchBookData(bookId, env).catch(() => null);
  if (!book) {
    return renderNotFoundPage(request, env);
  }

  const metadata = {
    ...buildBookMetadata(book, url.pathname),
    jsonLd: [
      buildBookJsonLd(book, url.pathname),
      buildBookBreadcrumbJsonLd(book, url.pathname),
    ],
  };
  const injectedHtml = injectMetadata(assetHtml, metadata);
  const headers = new Headers(assetResponse.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  return withSecurityHeaders(new Response(injectedHtml, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const routeType = classifyRoute(url.pathname);

    if (routeType === 'sitemap') {
      return withSecurityHeaders(await proxySitemap(request, env));
    }

    if (request.method === 'GET' && routeType === 'book') {
      return withSecurityHeaders(await injectBookPageMetadata(request, env));
    }

    if (routeType === 'unknown') {
      return withSecurityHeaders(await renderNotFoundPage(request, env));
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};

export {
  buildBookMetadata,
  buildBookBreadcrumbJsonLd,
  buildBookJsonLd,
  buildFallbackMetadata,
  injectMetadata,
  isAssetPath,
  isKnownPrivateSpaRoute,
  isKnownPublicStaticRoute,
  isPrerenderedBookHtml,
  classifyRoute,
  matchBookPath,
  normalizeDescription,
  normalizeRoutePath,
};
