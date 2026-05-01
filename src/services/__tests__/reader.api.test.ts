import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

const mockEnv = {
  VITE_API_BASE_URL: 'https://api.example.com',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

import { api, __resetHasApiForTesting, __setHasApiForTesting } from '../api';

const createJsonResponse = (payload: unknown, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(payload),
  text: () => Promise.resolve(typeof payload === 'string' ? payload : JSON.stringify(payload)),
  headers: new Headers({ 'content-type': 'application/json' }),
} as Response);

describe('Reader API', () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(createJsonResponse({}));
  });

  afterEach(() => {
    vi.clearAllMocks();
    __resetHasApiForTesting();
  });

  describe('getReadingPosition', () => {
    it('returns null when backend reports no saved position', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse({ page_number: null }));

      await expect(api.getReadingPosition(42)).resolves.toBeNull();
    });

    it('returns the reading position payload when present', async () => {
      const payload = {
        id: 9,
        page_number: 17,
        updated_at: '2026-03-23T12:00:00Z',
      };
      fetchSpy.mockResolvedValueOnce(createJsonResponse(payload));

      await expect(api.getReadingPosition(42)).resolves.toEqual(payload);
    });

    it('returns null when API access is disabled', async () => {
      __setHasApiForTesting(false);

      await expect(api.getReadingPosition(42)).resolves.toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('getReaderAccess', () => {
    it('fetches access with skipAuth for preview mode', async () => {
      const accessPayload = {
        book_id: 1,
        title: 'Test Book',
        author: 'Test Author',
        access_type: 'educational' as const,
        access_label: 'სასწავლო' as const,
        mode: 'preview' as const,
        status: 'ready' as const,
        can_read: true,
        can_download: false,
        expires_at: null,
        preview_pages: 10 as const,
        total_pages: 25,
        document_url: 'https://api.example.com/books/1/read/document/?preview=1',
        download_url: null,
      };
      fetchSpy.mockResolvedValueOnce(createJsonResponse(accessPayload));

      const result = await api.getReaderAccess(1, true);
      expect(result).toEqual(accessPayload);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/books/1/read/access/?preview=1'),
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('throws when API access is disabled', async () => {
      __setHasApiForTesting(false);
      await expect(api.getReaderAccess(1)).rejects.toThrow('BACKEND_NOT_CONFIGURED');
    });
  });

  describe('getReaderPages', () => {
    it('fetches a window of reader pages', async () => {
      const payload = {
        book_id: 1,
        total_pages: 25,
        preview: false,
        pages: [
          {
            page_number: 2,
            render_mode: 'html' as const,
            html: '<p>Page 2</p>',
            image_url: null,
            page_width: null,
            page_height: null,
          },
        ],
      };
      fetchSpy.mockResolvedValueOnce(createJsonResponse(payload));

      const result = await api.getReaderPages(1, { start: 2, end: 6 });
      expect(result).toEqual(payload);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/books/1/read/pages/?start=2&end=6'),
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('uses preview auth behavior for preview page windows', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse({ book_id: 1, total_pages: 10, preview: true, pages: [] }));

      await api.getReaderPages(1, { start: 1, end: 3, preview: true });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/books/1/read/pages/?start=1&end=3&preview=1'),
        expect.objectContaining({ credentials: 'include' })
      );
    });
  });
});
