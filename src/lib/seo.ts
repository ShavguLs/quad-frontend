import type { Ad, Book, Review } from '../types';

export const SITE_NAME = 'Quaduni';
export const SITE_URL = 'https://quaduni.com';
export const SITE_THEME_COLOR = '#000000';
export const DEFAULT_OG_IMAGE_PATH = '/og-default.png';
export const DEFAULT_OG_IMAGE_URL = new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).toString();
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

export interface AggregateRatingInput {
  ratingValue: number | string;
  reviewCount: number | string;
  bestRating?: number | string;
}

export interface ReviewSchemaInput {
  authorName: string;
  datePublished: string;
  reviewBody: string;
  rating: number | string;
}

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

export const isDefaultOgImage = (image?: string | null): boolean => resolveOgImage(image) === DEFAULT_OG_IMAGE_URL;

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

type BookPathInput = Pick<Book, 'id' | 'url_slug'> | string | number;

export const getBookPath = (bookOrId: BookPathInput, urlSlug?: string | null): string => {
  if (typeof bookOrId === 'string' || typeof bookOrId === 'number') {
    const slug = typeof urlSlug === 'string' ? urlSlug.trim() : '';
    return slug ? `/book/${slug}--${bookOrId}` : `/book/${bookOrId}`;
  }

  const slug = typeof bookOrId.url_slug === 'string' ? bookOrId.url_slug.trim() : '';
  return slug ? `/book/${slug}--${bookOrId.id}` : `/book/${bookOrId.id}`;
};

export const getAggregateRatingFromReviews = (reviews: Review[]): AggregateRatingInput | undefined => {
  if (reviews.length === 0) {
    return undefined;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  return {
    ratingValue: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length,
    bestRating: 5,
  };
};

export const buildAggregateRatingJsonLd = (
  aggregateRating?: AggregateRatingInput,
): Record<string, unknown> | undefined => {
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
};

export const buildBookJsonLd = (
  book: Book,
  options?: { aggregateRating?: AggregateRatingInput },
): Record<string, unknown> => {
  const canonicalUrl = toAbsoluteUrl(getBookPath(book));
  const bookCover = getBookCoverImage(book);
  const price = normalizePriceValue(book.price);
  const aggregateRating = buildAggregateRatingJsonLd(options?.aggregateRating);

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
    ...(aggregateRating ? { aggregateRating } : {}),
  };
};

export const buildBookReviewJsonLd = (
  book: Pick<Book, 'id' | 'title' | 'url_slug'>,
  review: ReviewSchemaInput,
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  itemReviewed: {
    '@type': 'Book',
    name: book.title,
    url: toAbsoluteUrl(getBookPath(book)),
  },
  author: {
    '@type': 'Person',
    name: review.authorName,
  },
  datePublished: review.datePublished,
  reviewBody: review.reviewBody,
  reviewRating: {
    '@type': 'Rating',
    ratingValue: String(review.rating),
    bestRating: '5',
  },
});

export const buildBookBreadcrumbJsonLd = (book: Pick<Book, 'id' | 'title' | 'url_slug'>): Record<string, unknown> => ({
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
      item: toAbsoluteUrl(getBookPath(book)),
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

export const getAdPath = (slug: string): string => `/blog/${slug}/`;

export const buildAdJsonLd = (ad: Ad): Record<string, unknown> => {
  const canonicalUrl = toAbsoluteUrl(getAdPath(ad.slug));
  const publisherName = ad.publisher.display_name || ad.publisher.handle;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: ad.seo_title || ad.title,
    description: ad.seo_description || ad.title,
    articleSection: ad.category,
    keywords: ad.seo_keywords || undefined,
    datePublished: ad.created_at,
    dateModified: ad.updated_at || ad.created_at,
    author: {
      '@type': 'Person',
      name: publisherName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    image: resolveOgImage(ad.image),
    inLanguage: 'ka',
  };
};
