import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReaderPage } from '../../components/ReaderPage';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getBook: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:8000',
}));

vi.mock('../../components/VirtualizedPdfReader', () => ({
  VirtualizedPdfReader: ({ pdfUrl }: { pdfUrl: string }) => (
    <div data-testid="mock-pdf-reader">{pdfUrl}</div>
  ),
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
});
