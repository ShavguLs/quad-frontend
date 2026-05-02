import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReaderPage } from '../../components/ReaderPage';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getBook: vi.fn(),
    getReadingPosition: vi.fn(),
    updateReadingPosition: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:8000',
}));

let onPageChangeCallback: ((page: number) => void) | null = null;

vi.mock('../../components/VirtualizedPdfReader', () => ({
  VirtualizedPdfReader: ({ pdfUrl, initialPage, onCurrentPageChange }: { pdfUrl: string; initialPage?: number; onCurrentPageChange?: (page: number) => void }) => {
    onPageChangeCallback = onCurrentPageChange ?? null;
    return (
      <div data-testid="mock-pdf-reader" data-initial-page={initialPage ?? 1}>{pdfUrl}</div>
    );
  },
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  handle: 'testuser',
};

describe('ReaderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onPageChangeCallback = null;
    vi.mocked(api.getReadingPosition).mockResolvedValue({
      book_id: 123,
      page_number: null,
      bookId: 123,
      pageNumber: null,
      updated_at: null,
      updatedAt: null,
    });
  });

  it('renders loading state initially', () => {
    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/წიგნი იტვირთება/i)).toBeInTheDocument();
  });

  it('renders virtualized reader when metadata loads', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-pdf-reader')).toHaveTextContent('http://localhost:8000/books/123/read/');
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('renders error state on metadata load failure', async () => {
    vi.mocked(api.getBook).mockRejectedValueOnce(new Error('API ERROR'));

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/API ERROR/i)).toBeInTheDocument();
    });
  });

  it('passes saved position as initialPage when available', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
      totalPages: 200,
    } as any);
    vi.mocked(api.getReadingPosition).mockResolvedValueOnce({
      book_id: 123,
      page_number: 55,
      bookId: 123,
      pageNumber: 55,
      updated_at: '2026-05-02T12:00:00Z',
      updatedAt: '2026-05-02T12:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-pdf-reader')).toHaveAttribute('data-initial-page', '55');
  });

  it('defaults to initialPage 1 when no saved position', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);
    vi.mocked(api.getReadingPosition).mockResolvedValueOnce({
      book_id: 123,
      page_number: null,
      bookId: 123,
      pageNumber: null,
      updated_at: null,
      updatedAt: null,
    });

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-pdf-reader')).toHaveAttribute('data-initial-page', '1');
  });

  it('renders reader even if reading position load fails', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);
    vi.mocked(api.getReadingPosition).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-pdf-reader')).toHaveAttribute('data-initial-page', '1');
  });

  it('clamps saved position to totalPages when exceeded', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
      totalPages: 100,
    } as any);
    vi.mocked(api.getReadingPosition).mockResolvedValueOnce({
      book_id: 123,
      page_number: 200,
      bookId: 123,
      pageNumber: 200,
      updated_at: '2026-05-02T12:00:00Z',
      updatedAt: '2026-05-02T12:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-pdf-reader')).toHaveAttribute('data-initial-page', '100');
  });

  it('calls updateReadingPosition after debounce when page changes', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);
    vi.mocked(api.updateReadingPosition).mockResolvedValueOnce({});

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    expect(api.updateReadingPosition).not.toHaveBeenCalled();

    vi.useFakeTimers();
    onPageChangeCallback!(5);
    expect(api.updateReadingPosition).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    vi.useRealTimers();

    await waitFor(() => {
      expect(api.updateReadingPosition).toHaveBeenCalledWith('123', 5);
    });
  });

  it('debounces rapid page changes into a single API call', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);
    vi.mocked(api.updateReadingPosition).mockResolvedValueOnce({});

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    vi.useFakeTimers();
    onPageChangeCallback!(3);
    vi.advanceTimersByTime(300);
    onPageChangeCallback!(7);
    vi.advanceTimersByTime(300);
    onPageChangeCallback!(10);

    expect(api.updateReadingPosition).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    vi.useRealTimers();

    await waitFor(() => {
      expect(api.updateReadingPosition).toHaveBeenCalledOnce();
    });
    expect(api.updateReadingPosition).toHaveBeenCalledWith('123', 10);
  });

  it('does not update lastSavedPageRef on failed save, allowing retry', async () => {
    vi.mocked(api.getBook).mockResolvedValueOnce({
      id: 123,
      title: 'Test Book',
      author: 'Test Author',
    } as any);
    vi.mocked(api.updateReadingPosition)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({});

    render(
      <MemoryRouter initialEntries={['/reader/123']}>
        <Routes>
          <Route
            path="/reader/:bookId"
            element={<ReaderPage user={mockUser as any} isAuthLoading={false} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-reader')).toBeInTheDocument();
    });

    vi.useFakeTimers();
    onPageChangeCallback!(5);
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();

    await waitFor(() => {
      expect(api.updateReadingPosition).toHaveBeenCalledTimes(1);
    });

    vi.useFakeTimers();
    onPageChangeCallback!(5);
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();

    await waitFor(() => {
      expect(api.updateReadingPosition).toHaveBeenCalledTimes(2);
    });
    expect(api.updateReadingPosition).toHaveBeenCalledWith('123', 5);
  });
});