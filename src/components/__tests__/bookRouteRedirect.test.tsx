import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from '../../App';

const mockBook = {
  id: 14,
  url_slug: 'შოთა-რუსთაველი-ვეფხისტყაოსანი',
  title: 'ვეფხისტყაოსანი',
  author: 'შოთა რუსთაველი',
  price: '10',
  description: 'ქართული კლასიკა',
  category: 'წიგნები',
  total_pages: 320,
};

const partialStateBook = {
  id: 14,
  url_slug: 'შოთა-რუსთაველი-ვეფხისტყაოსანი',
  title: 'ვეფხისტყაოსანი',
  author: 'შოთა რუსთაველი',
  price: '10',
};

const apiMock = vi.hoisted(() => ({
  getBooks: vi.fn(),
  getFeaturedBooks: vi.fn(),
  getReviews: vi.fn(),
  getBook: vi.fn(),
  getBookReviews: vi.fn(),
  getLibrary: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  api: apiMock,
}));

vi.mock('../../services/auth', () => ({
  auth: authMock,
}));

vi.mock('react-slick', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
};

const renderAppAt = (initialEntry: string | { pathname: string; state?: { book?: typeof mockBook } }) => render(
  <HelmetProvider>
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
      <LocationDisplay />
    </MemoryRouter>
  </HelmetProvider>,
);

describe('book route redirects', () => {
  beforeEach(() => {
    apiMock.getBooks.mockResolvedValue([mockBook]);
    apiMock.getFeaturedBooks.mockResolvedValue([]);
    apiMock.getReviews.mockResolvedValue([]);
    apiMock.getBook.mockResolvedValue(mockBook);
    apiMock.getBookReviews.mockResolvedValue([]);
    apiMock.getLibrary.mockResolvedValue([]);
    authMock.getSession.mockResolvedValue(null);
    authMock.logout.mockResolvedValue(undefined);

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
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('redirects old id-only routes to the canonical slug route', async () => {
    renderAppAt('/book/14');

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/book/შოთა-რუსთაველი-ვეფხისტყაოსანი--14');
    });

    expect(apiMock.getBook).toHaveBeenCalledTimes(1);
  });

  it('redirects mismatched slug routes to the canonical slug route', async () => {
    renderAppAt('/book/wrong-slug--14');

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/book/შოთა-რუსთაველი-ვეფხისტყაოსანი--14');
    });

    expect(apiMock.getBook).toHaveBeenCalledTimes(1);
  });

  it('keeps canonical slug routes stable', async () => {
    renderAppAt({
      pathname: '/book/შოთა-რუსთაველი-ვეფხისტყაოსანი--14',
      state: { book: mockBook },
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/book/შოთა-რუსთაველი-ვეფხისტყაოსანი--14');
    });

    await waitFor(() => {
      expect(apiMock.getBooks).toHaveBeenCalled();
    });
    expect(apiMock.getBook).not.toHaveBeenCalled();
  });

  it('hydrates canonical slug routes when location state has partial book data', async () => {
    renderAppAt({
      pathname: '/book/შოთა-რუსთაველი-ვეფხისტყაოსანი--14',
      state: { book: partialStateBook },
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/book/შოთა-რუსთაველი-ვეფხისტყაოსანი--14');
    });

    await waitFor(() => {
      expect(apiMock.getBook).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the existing not-found state for malformed routes without an id', async () => {
    renderAppAt('/book/only-slug');

    await waitFor(() => {
      expect(screen.getByText('ეს წიგნი კატალოგში აღარ ჩანს')).toBeTruthy();
    });
    expect(apiMock.getBook).not.toHaveBeenCalled();
  });
});
