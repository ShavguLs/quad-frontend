import type { Book } from '../types';

export const SITE_NAME = 'Quaduni';
export const SITE_URL = 'https://quaduni.com';
export const SITE_THEME_COLOR = '#000000';
export const DEFAULT_OG_IMAGE_PATH = '/og-default.png';
export const DEFAULT_OG_IMAGE_URL = new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).toString();

export const hasUsableImage = (value?: string | null): value is string => (
  typeof value === 'string' && value.trim().length > 0
);

export const toAbsoluteUrl = (value: string): string => {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith('data:')) {
    return trimmedValue;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith('//')) {
    return `https:${trimmedValue}`;
  }

  return new URL(trimmedValue, SITE_URL).toString();
};

export const resolveOgImage = (image?: string | null): string => (
  hasUsableImage(image) ? toAbsoluteUrl(image) : DEFAULT_OG_IMAGE_URL
);

export const getBookCoverImage = (book: Pick<Book, 'cover_image_url' | 'coverUrl' | 'img'>): string | undefined => {
  const coverImage = [book.cover_image_url, book.coverUrl, book.img].find(hasUsableImage);
  return coverImage?.trim();
};

export const normalizePriceValue = (value?: string | number | null): string | undefined => {
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

  const parsedValue = Number.parseFloat(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return undefined;
  }

  return normalizedValue;
};

export const getBookPath = (bookId: string | number): string => `/book/${bookId}`;

export const buildBookJsonLd = (book: Book): Record<string, unknown> => {
  const canonicalUrl = toAbsoluteUrl(getBookPath(book.id));
  const bookCover = getBookCoverImage(book);
  const price = normalizePriceValue(book.price);

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    url: canonicalUrl,
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
    bookFormat: 'https://schema.org/EBook',
    image: resolveOgImage(bookCover),
    ...(book.description ? { description: book.description } : {}),
    ...(book.created_at || book.createdAt
      ? { datePublished: book.created_at || book.createdAt }
      : {}),
    ...(book.updated_at
      ? { dateModified: book.updated_at }
      : {}),
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: 'GEL',
            url: canonicalUrl,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
};

export const buildBookBreadcrumbJsonLd = (book: Pick<Book, 'id' | 'title'>): Record<string, unknown> => ({
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
      item: toAbsoluteUrl('/books'),
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: book.title,
      item: toAbsoluteUrl(getBookPath(book.id)),
    },
  ],
});

export const buildHomeJsonLd = (): Array<Record<string, unknown>> => [
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
