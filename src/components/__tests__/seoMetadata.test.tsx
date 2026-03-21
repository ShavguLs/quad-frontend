import { cleanup, render, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../App';
import { BookPage } from '../BookPage';
import { NotFoundView } from '../NotFoundView';
import { SEOMeta } from '../SEOMeta';
import { TermsView } from '../TermsView';
import { buildHomeJsonLd } from '../../lib/seo';
import type { Book } from '../../types';

const { getBookReviewsMock } = vi.hoisted(() => ({
  getBookReviewsMock: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/api', () => ({
  api: {
    getBookReviews: getBookReviewsMock,
  },
}));

vi.mock('react-slick', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const DEFAULT_OG_IMAGE_URL = 'https://quaduni.com/og-default.png';

const renderWithHelmet = (ui: ReactElement) => render(
  <HelmetProvider>
    <MemoryRouter>{ui}</MemoryRouter>
  </HelmetProvider>,
);

const renderWithHelmetAndRouter = (ui: ReactElement, initialEntries: string[] = ['/']) => render(
  <HelmetProvider>
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  </HelmetProvider>,
);

const getMetaContent = (selector: string): string | null => document.head.querySelector(selector)?.getAttribute('content') ?? null;

const getJsonLdScripts = (): Record<string, unknown>[] => Array.from(document.head.querySelectorAll('script[data-rh="true"][type="application/ld+json"]'))
  .map((jsonLd) => JSON.parse(jsonLd.textContent || '{}') as Record<string, unknown>);

const createBook = (overrides: Partial<Book> = {}): Book => ({
  id: 1,
  title: 'ტესტ წიგნი',
  author: 'ტესტ ავტორი',
  price: '12',
  description: 'ტესტ აღწერა',
  category: 'წიგნები',
  ...overrides,
});

describe('SEO metadata', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    getBookReviewsMock.mockResolvedValue([]);
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
      unobserve() {}
    });
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    cleanup();
    document.head.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('uses the default OG image when no explicit image is provided', async () => {
    renderWithHelmet(
      <SEOMeta
        title="მთავარი"
        description="Quaduni-ის მთავარი გვერდი"
        canonical="/"
      />,
    );

    await waitFor(() => {
      expect(getMetaContent('meta[property="og:image"]')).toBe(DEFAULT_OG_IMAGE_URL);
      expect(getMetaContent('meta[property="og:image:width"]')).toBe('1200');
      expect(getMetaContent('meta[property="og:image:height"]')).toBe('630');
      expect(getMetaContent('meta[name="twitter:image"]')).toBe(DEFAULT_OG_IMAGE_URL);
    });
  });

  it('uses a book cover when a usable cover image exists', async () => {
    renderWithHelmet(
      <BookPage
        book={createBook({ cover_image_url: '/media/covers/book-1.png' })}
        relatedBooks={[]}
        user={null}
        isAuthLoading={false}
        onBack={vi.fn()}
        onAddToCart={vi.fn()}
        onReadBook={vi.fn()}
        onOpenBook={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getMetaContent('meta[property="og:image"]')).toBe('https://quaduni.com/media/covers/book-1.png');
      expect(getMetaContent('meta[property="og:image:width"]')).toBeNull();
      expect(getMetaContent('meta[property="og:image:height"]')).toBeNull();
      expect(getJsonLdScripts()[0]?.image).toBe('https://quaduni.com/media/covers/book-1.png');
    });
  });

  it('falls back to the default OG image when a book cover is missing', async () => {
    renderWithHelmet(
      <BookPage
        book={createBook({ cover_image_url: '   ', coverUrl: '', img: undefined })}
        relatedBooks={[]}
        user={null}
        isAuthLoading={false}
        onBack={vi.fn()}
        onAddToCart={vi.fn()}
        onReadBook={vi.fn()}
        onOpenBook={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getMetaContent('meta[property="og:image"]')).toBe(DEFAULT_OG_IMAGE_URL);
      expect(getMetaContent('meta[property="og:image:width"]')).toBe('1200');
      expect(getMetaContent('meta[property="og:image:height"]')).toBe('630');
      expect(getMetaContent('meta[name="twitter:image"]')).toBe(DEFAULT_OG_IMAGE_URL);
      expect(getJsonLdScripts()[0]?.image).toBe(DEFAULT_OG_IMAGE_URL);
    });
  });

  it('renders terms metadata on the public terms page', async () => {
    renderWithHelmetAndRouter(<TermsView />, ['/terms']);

    await waitFor(() => {
      expect(document.title).toBe('წესები და კონფიდენციალურობა | Quaduni');
      expect(getMetaContent('meta[name="description"]')).toContain('გამოყენების წესები');
      expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://quaduni.com/terms');
    });
  });

  it('supports custom robots, theme color, and image alt tags', async () => {
    renderWithHelmet(
      <SEOMeta
        title="ტესტი"
        description="მეტამონაცემების ტესტი"
        canonical="/test"
        robots="noarchive,max-image-preview:large"
        ogImageAlt="ტესტური სურათი"
        themeColor="#101010"
      />,
    );

    await waitFor(() => {
      expect(getMetaContent('meta[name="robots"]')).toBe('noarchive,max-image-preview:large');
      expect(getMetaContent('meta[name="theme-color"]')).toBe('#101010');
      expect(getMetaContent('meta[property="og:image:alt"]')).toBe('ტესტური სურათი');
      expect(getMetaContent('meta[name="twitter:image:alt"]')).toBe('ტესტური სურათი');
    });
  });

  it('renders noindex metadata on the not-found page', async () => {
    renderWithHelmetAndRouter(<NotFoundView />, ['/definitely-not-a-real-page']);

    await waitFor(() => {
      expect(getMetaContent('meta[name="robots"]')).toBe('noindex,nofollow');
      expect(document.title).toBe('გვერდი ვერ მოიძებნა | Quaduni');
    });
  });

  it('normalizes book schema price, ratings, and includes breadcrumbs', async () => {
    getBookReviewsMock.mockResolvedValue([
      {
        id: 1,
        user: 'მკითხველი 1',
        bookTitle: 'ტესტ წიგნი',
        bookId: 77,
        rating: 5,
        content: 'ძალიან კარგი წიგნია და ყველას ვურჩევ წასაკითხად.',
        date: '2026-03-05T10:00:00Z',
      },
      {
        id: 2,
        user: 'მკითხველი 2',
        bookTitle: 'ტესტ წიგნი',
        bookId: 77,
        rating: 4,
        content: 'საინტერესო ტექსტი და კარგი რიტმი აქვს მთელ წიგნს.',
        date: '2026-03-06T10:00:00Z',
      },
    ]);

    renderWithHelmet(
      <BookPage
        book={createBook({ id: 77, price: '₾ 12.50', cover_image_url: '/media/covers/book-77.png', created_at: '2026-03-01', updated_at: '2026-03-10' })}
        relatedBooks={[]}
        user={null}
        isAuthLoading={false}
        onBack={vi.fn()}
        onAddToCart={vi.fn()}
        onReadBook={vi.fn()}
        onOpenBook={vi.fn()}
      />,
    );

    await waitFor(() => {
      const [bookJsonLd, breadcrumbJsonLd, reviewJsonLd] = getJsonLdScripts();
      expect(((bookJsonLd as { offers?: { price?: string } }).offers)?.price).toBe('12.50');
      expect(((bookJsonLd as { aggregateRating?: { ratingValue?: string; reviewCount?: string } }).aggregateRating)?.ratingValue).toBe('4.5');
      expect(((bookJsonLd as { aggregateRating?: { reviewCount?: string } }).aggregateRating)?.reviewCount).toBe('2');
      expect(bookJsonLd.url).toBe('https://quaduni.com/book/77');
      expect(bookJsonLd.inLanguage).toBe('ka');
      expect(breadcrumbJsonLd['@type']).toBe('BreadcrumbList');
      expect(reviewJsonLd['@type']).toBe('Review');
    });
  });

  it('can emit multiple site-level schema blocks for the home page', async () => {
    renderWithHelmet(
      <SEOMeta
        title="Quaduni - რჩეული წიგნები"
        description="Quaduni — ქართული ციფრული წიგნების მაღაზია. აღმოაჩინე, იყიდე და წაიკითხე ქართული წიგნები ონლაინ."
        canonical="/"
        jsonLd={buildHomeJsonLd()}
      />,
    );

    await waitFor(() => {
      const jsonLdBlocks = getJsonLdScripts();
      expect(jsonLdBlocks).toHaveLength(2);
      expect(jsonLdBlocks[0]?.['@type']).toBe('Organization');
      expect(jsonLdBlocks[1]?.['@type']).toBe('WebSite');
    });
  });

  it('renders a single primary h1 on the home page without changing metadata behavior', async () => {
    renderWithHelmetAndRouter(
      <HomePage
        onNavigate={vi.fn()}
        onBookClick={vi.fn()}
        featuredBooks={[]}
        archiveBooks={[]}
        catalogError={null}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(document.title).toBe('Quaduni - რჩეული წიგნები | Quaduni');
    });

    const headings = document.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe('Quaduni — ქართული ციფრული წიგნების მაღაზია');
  });

  it('ships the default OG image in the static HTML shell', () => {
    const indexHtml = readFileSync('index.html', 'utf-8');

    expect(indexHtml).toContain('property="og:image" content="https://quaduni.com/og-default.png"');
    expect(indexHtml).toContain('property="og:image:width" content="1200"');
    expect(indexHtml).toContain('property="og:image:height" content="630"');
    expect(indexHtml).toContain('name="twitter:image" content="https://quaduni.com/og-default.png"');
  });
});
