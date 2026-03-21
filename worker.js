const DEFAULT_SITEMAP_URL = 'https://api.quaduni.com/sitemap.xml';
const DEFAULT_BOOK_API_BASE_URL = 'https://api.quaduni.com';
const SITE_URL = 'https://quaduni.com';
const DEFAULT_OG_IMAGE = 'https://cdn-icons-png.flaticon.com/512/14931/14931711.png';

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
    ogUrl: canonical,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    robots: 'noindex,nofollow',
  };
}

function buildBookMetadata(book, pathname, apiBaseUrl = DEFAULT_BOOK_API_BASE_URL) {
  const canonical = new URL(pathname, SITE_URL).toString();
  const title = `${book.title} — ${book.author} | Quaduni`;
  const description = normalizeDescription(
    book.description,
    `${book.title} — ${book.author}-ის წიგნი Quaduni-ზე`
  );
  const image = toAbsoluteUrl(book.cover_image_url || book.coverUrl || book.img, apiBaseUrl);

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogUrl: canonical,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    ogType: 'book',
    robots: 'index,follow',
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
  html = replaceTagAttribute(html, 'data-seo-og-url', 'content', metadata.ogUrl);
  html = replaceTagAttribute(html, 'data-seo-twitter-title', 'content', metadata.twitterTitle);
  html = replaceTagAttribute(html, 'data-seo-twitter-description', 'content', metadata.twitterDescription);
  html = replaceTagAttribute(html, 'data-seo-twitter-image', 'content', metadata.twitterImage);
  return html;
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

async function injectBookPageMetadata(request, env) {
  const url = new URL(request.url);
  const bookId = matchBookPath(url.pathname);
  if (!bookId) {
    return env.ASSETS.fetch(request);
  }

  const [assetResponse, book] = await Promise.all([
    env.ASSETS.fetch(request),
    fetchBookData(bookId, env).catch(() => null),
  ]);

  if (!assetResponse.ok || !isHtmlResponse(assetResponse)) {
    return assetResponse;
  }

  const metadata = book
    ? buildBookMetadata(book, url.pathname, getBookApiBaseUrl(env))
    : buildFallbackMetadata(url.pathname);
  const injectedHtml = injectMetadata(await assetResponse.text(), metadata);
  const headers = new Headers(assetResponse.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(injectedHtml, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') {
      return proxySitemap(request, env);
    }

    if (request.method === 'GET' && matchBookPath(url.pathname)) {
      return injectBookPageMetadata(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

export {
  buildBookMetadata,
  buildFallbackMetadata,
  injectMetadata,
  matchBookPath,
  normalizeDescription,
};
