import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { BookPage } from '../BookPage';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getBookReviews: vi.fn(),
    getPurchasedLibrary: vi.fn(),
    voteOnReview: vi.fn(),
    removeVote: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    downloadBookPdf: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:8000',
}));

vi.mock('../SEOMeta', () => ({
  SEOMeta: () => null,
}));

vi.mock('../Breadcrumbs', () => ({
  Breadcrumbs: ({ items }: { items: Array<{ label: string }> }) => (
    <nav data-testid="breadcrumbs">{items.map(i => i.label).join(' > ')}</nav>
  ),
}));

vi.mock('../figma/ImageWithFallback', () => ({
  ImageWithFallback: ({ alt }: { alt: string }) => (
    <img alt={alt} />
  ),
}));

const baseBook = {
  id: '42',
  title: 'ტესტ წიგნი',
  author: 'ტესტ ავტორი',
  price: '₾15',
  category: 'პოეზია',
  description: 'აღწერა',
  access_type: 'educational' as const,
};

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  handle: 'testuser',
};

describe('BookPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getBookReviews).mockResolvedValue({ results: [] });
    vi.mocked(api.getPurchasedLibrary).mockResolvedValue([]);
  });

  it('renders preview link for non-purchased books', async () => {
    const book = { ...baseBook, can_read: false, can_download: false };

    render(
      <MemoryRouter>
        <BookPage
          book={book as any}
          relatedBooks={[]}
          user={mockUser as any}
          isAuthLoading={false}
          onBack={() => {}}
          onAddToCart={() => {}}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ნახვა')).toBeInTheDocument();
    });

    const previewLink = screen.getByText('ნახვა').closest('a');
    expect(previewLink).toHaveAttribute('href', '/preview/42');
  });

  it('does not render preview link when user can read the book', async () => {
    const book = { ...baseBook, can_read: true, can_download: false };

    render(
      <MemoryRouter>
        <BookPage
          book={book as any}
          relatedBooks={[]}
          user={mockUser as any}
          isAuthLoading={false}
          onBack={() => {}}
          onAddToCart={() => {}}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('წაკითხვა')).toBeInTheDocument();
    });

    expect(screen.queryByText('ნახვა')).not.toBeInTheDocument();
  });

  it('renders preview link for unauthenticated users on non-purchased books', async () => {
    const book = { ...baseBook, can_read: false, can_download: false };

    render(
      <MemoryRouter>
        <BookPage
          book={book as any}
          relatedBooks={[]}
          user={null}
          isAuthLoading={false}
          onBack={() => {}}
          onAddToCart={() => {}}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ნახვა')).toBeInTheDocument();
    });
  });

  it('renders buy button alongside preview for non-purchased books', async () => {
    const book = { ...baseBook, can_read: false, can_download: false };

    render(
      <MemoryRouter>
        <BookPage
          book={book as any}
          relatedBooks={[]}
          user={mockUser as any}
          isAuthLoading={false}
          onBack={() => {}}
          onAddToCart={() => {}}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ყიდვა')).toBeInTheDocument();
    });

    expect(screen.getByText('ნახვა')).toBeInTheDocument();
  });
});
