import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE_NAME = 'Quaduni';
const SITE_URL = 'https://quaduni.com';
const DEFAULT_OG_IMAGE_URL = `${SITE_URL}/og-default.png`;
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
  },
  {
    path: '/books',
    title: 'კატალოგი',
    description: 'ქართული წიგნების სრული კატალოგი — ზინები, ესსეები, ხელოვნება და არქივი. იპოვე შენი შემდეგი საკითხავი.',
  },
  {
    path: '/community',
    title: 'ქომუნითი',
    description: 'Quaduni-ს საზოგადოება — დისკუსიები, განცხადებები და ხელოვნება ქართველი მკითხველებისა და ავტორებისთვის.',
  },
  {
    path: '/reviews',
    title: 'შეფასებები',
    description: 'მკითხველთა შეფასებები და რეცენზიები ქართულ წიგნებზე. გაიგე რას ფიქრობს საზოგადოება.',
  },
  {
    path: '/terms',
    title: 'წესები და კონფიდენციალურობა',
    description: 'Quaduni-ს გამოყენების წესები, კონფიდენციალურობის პოლიტიკა და ციფრული წიგნების გაყიდვის პირობები ერთ გვერდზე.',
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

function buildBookJsonLd(book) {
  const canonical = toAbsoluteUrl(`/book/${book.id}`);
  const price = normalizePriceValue(book.price);
  const image = resolveOgImage(book.cover_image_url || book.coverUrl || book.img);

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

async function fetchAllBooks() {
  const collectedBooks = [];
  let nextUrl = `${API_BASE_URL}/books/?page=1&page_size=200`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Book route generation failed with status ${response.status} from ${nextUrl}`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.results)) {
      throw new Error(`Book route generation received an invalid payload from ${nextUrl}`);
    }

    collectedBooks.push(...payload.results);
    nextUrl = payload.next;
  }

  return collectedBooks;
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

function buildSeoHtml(baseHtml, metadata) {
  const canonical = toAbsoluteUrl(metadata.path);
  const fullTitle = `${metadata.title} | ${SITE_NAME}`;
  const image = resolveOgImage(metadata.image);
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
  html = html.replace(/\s*<meta[^>]*(?:data-seo-og-image(?:-alt)?|property="og:image(?::alt)?")[^>]*>/g, '');
  html = html.replace(
    /(<meta data-seo-og-type[^>]*>)/,
    `$1\n      <meta data-seo-og-image property="og:image" content="${image}" />\n      <meta data-seo-og-image-alt property="og:image:alt" content="${escapeAttribute(ogImageAlt)}" />`,
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

  return html;
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

async function writeRouteHtml(routePath, html) {
  const normalizedPath = routePath === '/' ? '' : routePath.replace(/^\//, '');
  const outputDir = path.join(DIST_DIR, normalizedPath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

async function main() {
  const baseHtml = await readFile(DIST_INDEX_PATH, 'utf8');
  const books = await fetchAllBooks();

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
    const image = book.cover_image_url || book.coverUrl || book.img;
    const html = buildSeoHtml(baseHtml, {
      path: `/book/${book.id}`,
      title: `${book.title} — ${book.author}`,
      description: book.description || `${book.title} — ${book.author}-ის წიგნი Quaduni-ზე`,
      type: 'book',
      image,
      ogImageAlt: `${book.title} — გარეკანი`,
      jsonLd: [buildBookJsonLd(book), buildBookBreadcrumbJsonLd(book)],
    });

    await writeRouteHtml(`/book/${book.id}`, html);

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
}

main().catch((error) => {
  console.error('[prerender] failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
