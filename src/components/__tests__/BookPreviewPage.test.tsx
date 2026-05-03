import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BookPreviewPage } from '../../components/BookPreviewPage';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getBook: vi.fn(),
    getReadingPosition: vi.fn(),
    updateReadingPosition: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:8000',
}));

vi.mock('../../components/VirtualizedPdfReader', () => ({
  VirtualizedPdfReader: ({ pdfUrl, initialPage }: { pdfUrl: string; initialPage?: number }) => (
    <div data-testid="mock-pdf-reader" data-initial-page={initialPage ?? 1}>{pdfUrl}</div>
  ),
}));

vi.mock('../../components/SEOMeta', () => ({
  SEOMeta: ({ title }: { title: string }) => <title>{title}</title>,
}));

vi.mock('../../lib/seo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/seo')>();
  return {
    ...actual,
    getBookPath: (book: { id: unknown; slug?: string }) => `/book/${book.id}`,
  };
});

describe('BookPreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <MemoryRouter initialEntries={['/preview/123']}>
        <Routes>
          <Route path="/preview/:bookId" element={<BookPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/პრევიუ იტვირთება/i)).toBeInTheDocument();
  });

  it('renders preview reader with correct URL when book loads', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);

    render(
      <MemoryRouter initialEntries={['/preview/123']}>
        <Routes>
          <Route path="/preview/:bookId" element={<BookPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-pdf-reader')).toHaveTextContent('http://localhost:8000/books/123/preview/');
    expect(screen.getByTestId('mock-pdf-reader')).toHaveAttribute('data-initial-page', '1');
  });

  it('does not call reading position APIs', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);

    render(
      <MemoryRouter initialEntries={['/preview/123']}>
        <Routes>
          <Route path="/preview/:bookId" element={<BookPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(api.getReadingPosition).not.toHaveBeenCalled();
    expect(api.updateReadingPosition).not.toHaveBeenCalled();
  });

  it('renders error state on book load failure', async () => {
    vi.mocked(api.getBook).mockRejectedValueOnce(new Error('API ERROR'));

    render(
      <MemoryRouter initialEntries={['/preview/123']}>
        <Routes>
          <Route path="/preview/:bookId" element={<BookPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/შეცდომა/i)).toBeInTheDocument();
    });
  });

  it('shows preview banner text', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);

    render(
      <MemoryRouter initialEntries={['/preview/123']}>
        <Routes>
          <Route path="/preview/:bookId" element={<BookPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(screen.getByText(/წიგნის პირველი გვერდების წინასწარი ნახვა/i)).toBeInTheDocument();
  });
});