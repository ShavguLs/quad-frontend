import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE_NAME = 'Quaduni';
const SITE_URL = 'https://quaduni.com';
const DEFAULT_OG_IMAGE_URL = `${SITE_URL}/og-default.png`;
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;
const SITE_THEME_COLOR = '#000000';
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const DIST_INDEX_PATH = path.join(DIST_DIR, 'index.html');
const API_BASE_URL = (process.env.VITE_API_BASE_URL || process.env.SEO_PRERENDER_API_BASE_URL || 'https://api.quaduni.com').replace(/\/+$/, '');

const STATIC_ROUTES = [
  {
    path: '/',
    title: 'Quaduni - რჩეული წიგნები',
    description: 'Quaduni — ქართული ციფრული წიგნების მაღაზია. აღმოაჩინე, იყიდე და წაიკითხე ქართული წიგნები ონლაინ.',
    jsonLd: buildHomeJsonLd(),
    sitemap: {
      changefreq: 'daily',
      priority: '1.0',
    },
  },
  {
    path: '/books',
    title: 'კატალოგი',
    description: 'ქართული წიგნების სრული კატალოგი — ზინები, ესსეები, ხელოვნება და არქივი. იპოვე შენი შემდეგი საკითხავი.',
    sitemap: {
      changefreq: 'daily',
      priority: '0.9',
    },
  },
  {
    path: '/community',
    title: 'ქომუნითი',
    description: 'Quaduni-ს საზოგადოება — დისკუსიები, განცხადებები და ხელოვნება ქართველი მკითხველებისა და ავტორებისთვის.',
    sitemap: {
      changefreq: 'daily',
      priority: '0.7',
    },
  },
  {
    path: '/reviews',
    title: 'შეფასებები',
    description: 'მკითხველთა შეფასებები და რეცენზიები ქართულ წიგნებზე. გაიგე რას ფიქრობს საზოგადოება.',
    sitemap: {
      changefreq: 'daily',
      priority: '0.7',
    },
  },
  {
    path: '/terms',
    title: 'წესები და კონფიდენციალურობა',
    description: 'Quaduni-ს გამოყენების წესები, კონფიდენციალურობის პოლიტიკა და ციფრული წიგნების გაყიდვის პირობები ერთ გვერდზე.',
    sitemap: {
      changefreq: 'monthly',
      priority: '0.4',
    },
  },
];

const PRIVATE_ROUTES = [
  { path: '/login', title: 'შესვლა', description: 'Quaduni-ს ავტორიზაციის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/register', title: 'რეგისტრაცია', description: 'Quaduni-ს რეგისტრაციის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/profile', title: 'პროფილი', description: 'Quaduni-ს ანგარიშის პროფილის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/wallet', title: 'საფულე', description: 'Quaduni-ს პირადი საფულის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/upload', title: 'წიგნის ატვირთვა', description: 'Quaduni-ს ავტორის ატვირთვის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/library', title: 'ბიბლიოთეკა', description: 'Quaduni-ს პირადი ბიბლიოთეკის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/my-books', title: 'ჩემი წიგნები', description: 'Quaduni-ს ავტორის წიგნების მართვის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/reader', title: 'წიგნის მკითხველი', description: 'Quaduni-ს პირადი მკითხველის გვერდი ინდექსაციისთვის გამორთულია.' },
  { path: '/draft', title: 'წიგნის დრაფტი', description: 'Quaduni-ს ავტორის სამუშაო სივრცე ინდექსაციისთვის გამორთულია.' },
];

const PRIVATE_DYNAMIC_ROUTE_META = {
  reader: {
    title: 'წიგნის მკითხველი',
    description: 'Quaduni-ს პირადი მკითხველის გვერდი ინდექსაციისთვის გამორთულია.',
  },
  draft: {
    title: 'წიგნის დრაფტი',
    description: 'Quaduni-ს ავტორის სამუშაო სივრცე ინდექსაციისთვის გამორთულია.',
  },
};

function toAbsoluteUrl(value) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return new URL(value, SITE_URL).toString();
}

function resolveOgImage(image) {
  return image ? toAbsoluteUrl(image) : DEFAULT_OG_IMAGE_URL;
}

function isDefaultOgImage(image) {
  return resolveOgImage(image) === DEFAULT_OG_IMAGE_URL;
}

function normalizePriceValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const cleaned = value.trim().replace(/[^\d.,-]/g, '');
  if (!cleaned) {
    return undefined;
  }

  const normalized = cleaned.includes(',') && !cleaned.includes('.')
    ? cleaned.replace(',', '.')
    : cleaned.replace(/,/g, '');

  return Number.isFinite(Number.parseFloat(normalized)) ? normalized : undefined;
}

function getAggregateRatingFromReviews(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return undefined;
  }

  const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const averageRating = totalRating / reviews.length;

  return {
    ratingValue: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length,
    bestRating: 5,
  };
}

function buildAggregateRatingJsonLd(aggregateRating) {
  if (!aggregateRating) {
    return undefined;
  }

  const ratingValue = Number(aggregateRating.ratingValue);
  const reviewCount = Number(aggregateRating.reviewCount);
  const bestRating = Number(aggregateRating.bestRating ?? 5);

  if (!Number.isFinite(ratingValue) || !Number.isFinite(reviewCount) || reviewCount <= 0) {
    return undefined;
  }

  return {
    '@type': 'AggregateRating',
    ratingValue: Number(ratingValue.toFixed(1)).toString(),
    reviewCount: Math.trunc(reviewCount).toString(),
    bestRating: Number.isFinite(bestRating) ? bestRating.toString() : '5',
  };
}

function buildHomeJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: DEFAULT_OG_IMAGE_URL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'ka',
    },
  ];
}

function buildBookJsonLd(book, options = {}) {
  const canonical = toAbsoluteUrl(`/book/${book.id}`);
  const price = normalizePriceValue(book.price);
  const image = resolveOgImage(book.cover_image_url || book.coverUrl || book.img);
  const aggregateRating = buildAggregateRatingJsonLd(options.aggregateRating);

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
      name: SITE_NAME,
      url: SITE_URL,
    },
    image,
    bookFormat: 'https://schema.org/EBook',
    ...(book.description ? { description: book.description } : {}),
    ...(book.created_at || book.createdAt ? { datePublished: book.created_at || book.createdAt } : {}),
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
    ...(aggregateRating ? { aggregateRating } : {}),
  };
}

function buildBookReviewJsonLd(book, review) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Book',
      name: book.title,
      url: toAbsoluteUrl(`/book/${book.id}`),
    },
    author: {
      '@type': 'Person',
      name: review.user,
    },
    datePublished: review.date,
    reviewBody: review.content,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(review.rating),
      bestRating: '5',
    },
  };
}

function buildBookBreadcrumbJsonLd(book) {
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
        item: `${SITE_URL}/books`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: book.title,
        item: `${SITE_URL}/book/${book.id}`,
      },
    ],
  };
}

async function fetchPaginatedCollection(initialUrl, errorLabel) {
  const collectedItems = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`${errorLabel} failed with status ${response.status} from ${nextUrl}`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.results)) {
      throw new Error(`${errorLabel} received an invalid payload from ${nextUrl}`);
    }

    collectedItems.push(...payload.results);
    nextUrl = payload.next;
  }

  return collectedItems;
}

async function fetchAllBooks() {
  return fetchPaginatedCollection(
    `${API_BASE_URL}/books/?page=1&page_size=200`,
    'Book route generation',
  );
}

async function fetchAllReviews() {
  try {
    return await fetchPaginatedCollection(
      `${API_BASE_URL}/reviews/?page=1&page_size=200`,
      'Review SEO generation',
    );
  } catch (error) {
    console.warn('[prerender] reviews unavailable, continuing without review schema:', error instanceof Error ? error.message : error);
    return [];
  }
}

function groupReviewsByBook(reviews) {
  return reviews.reduce((accumulator, review) => {
    const rawBookId = review.bookId ?? review.book;
    if (rawBookId === undefined || rawBookId === null || rawBookId === '') {
      return accumulator;
    }

    const key = String(rawBookId);

    if (!accumulator.has(key)) {
      accumulator.set(key, []);
    }

    accumulator.get(key).push(review);
    return accumulator;
  }, new Map());
}

function replaceTag(html, selector, replacement) {
  return html.replace(selector, replacement);
}

function replaceMarkedElement(html, marker, replacement) {
  let nextHtml = html;
  let markerIndex = nextHtml.indexOf(marker);

  while (markerIndex !== -1) {
    const tagStart = nextHtml.lastIndexOf('<', markerIndex);
    const tagEnd = nextHtml.indexOf('>', markerIndex);

    if (tagStart === -1 || tagEnd === -1) {
      break;
    }

    nextHtml = `${nextHtml.slice(0, tagStart)}${replacement}${nextHtml.slice(tagEnd + 1)}`;
    markerIndex = nextHtml.indexOf(marker, tagStart + replacement.length);
  }

  return nextHtml;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReviewContentHtml(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return '';
  }

  const items = reviews.map((review) => {
    const parsedDate = review.date ? new Date(review.date) : null;
    const publishedDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;

    return [
      '        <article itemscope itemtype="https://schema.org/Review">',
      `          <h2 itemprop="author">${escapeHtml(review.user || 'Quaduni მკითხველი')}</h2>`,
      publishedDate ? `          <time itemprop="datePublished" datetime="${publishedDate}">${escapeHtml(parsedDate.toLocaleDateString('ka-GE'))}</time>` : '',
      `          <p itemprop="reviewBody">${escapeHtml(review.content)}</p>`,
      '          <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">',
      `            <meta itemprop="ratingValue" content="${escapeHtml(String(review.rating))}" />`,
      '            <meta itemprop="bestRating" content="5" />',
      '          </div>',
      '        </article>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  return [
    '    <section data-seo-review-content aria-label="წიგნის მიმოხილვები" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">',
    '      <p>მკითხველთა მიმოხილვები</p>',
    items,
    '    </section>',
  ].join('\n');
}

function buildSeoHtml(baseHtml, metadata) {
  const canonical = toAbsoluteUrl(metadata.path);
  const fullTitle = `${metadata.title} | ${SITE_NAME}`;
  const image = resolveOgImage(metadata.image);
  const shouldIncludeOgDimensions = isDefaultOgImage(metadata.image);
  const ogImageAlt = metadata.ogImageAlt || `${metadata.title} — Quaduni`;
  const robots = metadata.robots || (metadata.noindex ? 'noindex,nofollow' : 'index,follow');
  const jsonLdScripts = (metadata.jsonLd || [])
    .map((block) => `      <script type="application/ld+json">${JSON.stringify(block)}</script>`)
    .join('\n');

  let html = baseHtml;
  html = replaceTag(html, /<title data-seo-title>.*?<\/title>/s, `<title data-seo-title>${fullTitle}</title>`);
  html = replaceMarkedElement(html, 'data-seo-description', `<meta data-seo-description name="description" content="${escapeAttribute(metadata.description)}" />`);
  html = replaceMarkedElement(html, 'data-seo-robots', `<meta data-seo-robots name="robots" content="${robots}" />`);
  html = replaceMarkedElement(html, 'data-seo-canonical', `<link data-seo-canonical rel="canonical" href="${canonical}" />`);
  html = replaceMarkedElement(html, 'data-seo-theme-color', `<meta data-seo-theme-color name="theme-color" content="${SITE_THEME_COLOR}" />`);
  html = replaceMarkedElement(html, 'data-seo-og-title', `<meta data-seo-og-title property="og:title" content="${escapeAttribute(fullTitle)}" />`);
  html = replaceMarkedElement(html, 'data-seo-og-description', `<meta data-seo-og-description property="og:description" content="${escapeAttribute(metadata.description)}" />`);
  html = replaceMarkedElement(html, 'data-seo-og-type', `<meta data-seo-og-type property="og:type" content="${metadata.type || 'website'}" />`);
  html = replaceMarkedElement(html, 'data-seo-og-url', `<meta data-seo-og-url property="og:url" content="${canonical}" />`);
  html = replaceMarkedElement(html, 'data-seo-twitter-title', `<meta data-seo-twitter-title name="twitter:title" content="${escapeAttribute(fullTitle)}" />`);
  html = replaceMarkedElement(html, 'data-seo-twitter-description', `<meta data-seo-twitter-description name="twitter:description" content="${escapeAttribute(metadata.description)}" />`);
  html = html.replace(/\s*<meta[^>]*(?:data-seo-og-image(?:-(?:alt|width|height))?|property="og:image(?::(?:alt|width|height))?")[^>]*>/g, '');
  html = html.replace(
    /(<meta data-seo-og-type[^>]*>)/,
    `$1\n      <meta data-seo-og-image property="og:image" content="${image}" />${shouldIncludeOgDimensions ? `\n      <meta data-seo-og-image-width property="og:image:width" content="${DEFAULT_OG_IMAGE_WIDTH}" />\n      <meta data-seo-og-image-height property="og:image:height" content="${DEFAULT_OG_IMAGE_HEIGHT}" />` : ''}\n      <meta data-seo-og-image-alt property="og:image:alt" content="${escapeAttribute(ogImageAlt)}" />`,
  );
  html = html.replace(/\s*<meta[^>]*(?:data-seo-twitter-image(?:-alt)?|name="twitter:image(?::alt)?")[^>]*>/g, '');
  html = html.replace(
    /(<meta data-seo-twitter-description[^>]*>)/,
    `$1\n      <meta data-seo-twitter-image name="twitter:image" content="${image}" />\n      <meta data-seo-twitter-image-alt name="twitter:image:alt" content="${escapeAttribute(ogImageAlt)}" />`,
  );
  html = html.replace(/\s*<script type="application\/ld\+json">.*?<\/script>/gs, '');

  if (jsonLdScripts) {
    html = html.replace('</head>', `${jsonLdScripts}\n    </head>`);
  }

  html = html.replace(/\s*<section data-seo-review-content[\s\S]*?<\/section>/g, '');
  if (metadata.reviewContentHtml) {
    html = html.replace('</body>', `${metadata.reviewContentHtml}\n  </body>`);
  }

  return html;
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

async function writeRouteHtml(routePath, html) {
  const normalizedPath = routePath === '/' ? '' : routePath.replace(/^\//, '');
  const outputDir = path.join(DIST_DIR, normalizedPath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

function formatSitemapDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString().slice(0, 10)
    : parsedDate.toISOString().slice(0, 10);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemapXml(entries) {
  const urlEntries = entries.map((entry) => [
    '  <url>',
    `    <loc>${escapeXml(toAbsoluteUrl(entry.path))}</loc>`,
    `    <lastmod>${escapeXml(formatSitemapDate(entry.lastmod))}</lastmod>`,
    `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
    `    <priority>${escapeXml(entry.priority)}</priority>`,
    '  </url>',
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
  ].join('\n');
}

async function main() {
  const baseHtml = await readFile(DIST_INDEX_PATH, 'utf8');
  const books = await fetchAllBooks();
  const reviews = await fetchAllReviews();
  const reviewsByBook = groupReviewsByBook(reviews);
  const sitemapEntries = STATIC_ROUTES.map((route) => ({
    path: route.path,
    lastmod: new Date().toISOString(),
    changefreq: route.sitemap.changefreq,
    priority: route.sitemap.priority,
  }));

  for (const route of STATIC_ROUTES) {
    const html = buildSeoHtml(baseHtml, route);
    await writeRouteHtml(route.path, html);
  }

  for (const route of PRIVATE_ROUTES) {
    const html = buildSeoHtml(baseHtml, { ...route, noindex: true });
    await writeRouteHtml(route.path, html);
  }

  const notFoundHtml = buildSeoHtml(baseHtml, {
    path: '/404',
    title: 'გვერდი ვერ მოიძებნა',
    description: 'მოთხოვნილი გვერდი Quaduni-ზე ვერ მოიძებნა. შეამოწმე ბმული ან დაბრუნდი კატალოგში.',
    noindex: true,
  });
  await writeFile(path.join(DIST_DIR, '404.html'), notFoundHtml, 'utf8');
  await writeRouteHtml('/404', notFoundHtml);

  for (const book of books) {
    const allBookReviews = reviewsByBook.get(String(book.id)) || [];
    const bookReviews = allBookReviews.slice(0, 5);
    const image = book.cover_image_url || book.coverUrl || book.img;
    const aggregateRating = getAggregateRatingFromReviews(allBookReviews);
    const reviewSchema = bookReviews.map((review) => buildBookReviewJsonLd(book, review));
    const html = buildSeoHtml(baseHtml, {
      path: `/book/${book.id}`,
      title: `${book.title} — ${book.author}`,
      description: book.description || `${book.title} — ${book.author}-ის წიგნი Quaduni-ზე`,
      type: 'book',
      image,
      ogImageAlt: `${book.title} — გარეკანი`,
      jsonLd: [buildBookJsonLd(book, { aggregateRating }), buildBookBreadcrumbJsonLd(book), ...reviewSchema],
      reviewContentHtml: buildReviewContentHtml(bookReviews),
    });

    await writeRouteHtml(`/book/${book.id}`, html);
    sitemapEntries.push({
      path: `/book/${book.id}`,
      lastmod: book.updated_at || book.created_at || book.createdAt,
      changefreq: 'weekly',
      priority: '0.8',
    });

    await writeRouteHtml(
      `/reader/${book.id}`,
      buildSeoHtml(baseHtml, {
        path: `/reader/${book.id}`,
        title: PRIVATE_DYNAMIC_ROUTE_META.reader.title,
        description: PRIVATE_DYNAMIC_ROUTE_META.reader.description,
        noindex: true,
      }),
    );

    await writeRouteHtml(
      `/draft/${book.id}`,
      buildSeoHtml(baseHtml, {
        path: `/draft/${book.id}`,
        title: PRIVATE_DYNAMIC_ROUTE_META.draft.title,
        description: PRIVATE_DYNAMIC_ROUTE_META.draft.description,
        noindex: true,
      }),
    );
  }

  await writeFile(path.join(DIST_DIR, 'sitemap.xml'), buildSitemapXml(sitemapEntries), 'utf8');
}

main().catch((error) => {
  console.error('[prerender] failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
