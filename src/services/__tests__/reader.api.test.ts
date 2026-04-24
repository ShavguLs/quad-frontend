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

  describe('getReaderManifestPreview', () => {
    it('fetches manifest with skipAuth for preview mode', async () => {
      const manifestPayload = {
        book_id: 1,
        title: 'Test Book',
        author: 'Test Author',
        price: '₾10.00',
        status: 'ready' as const,
        extraction_status: 'completed' as const,
        total_pages: 15,
        available_pages: 10,
        access_mode: 'preview' as const,
        is_readable: true,
        page_frame_width: 595.0,
        page_frame_height: 842.0,
      };
      fetchSpy.mockResolvedValueOnce(createJsonResponse(manifestPayload));

      const result = await api.getReaderManifestPreview(1);
      expect(result).toEqual(manifestPayload);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/books/1/read/manifest/?preview=1'),
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('throws when API access is disabled', async () => {
      __setHasApiForTesting(false);
      await expect(api.getReaderManifestPreview(1)).rejects.toThrow('BACKEND_NOT_CONFIGURED');
    });
  });

  describe('getReaderPagePreview', () => {
    it('fetches page with skipAuth for preview mode', async () => {
      const pagePayload = {
        book_id: 1,
        page_number: 5,
        render_mode: 'html' as const,
        render_html: '<p>Page 5 content</p>',
        fallback_image_data: null,
        blocks: [],
        version: 1,
        page_width: 595.0,
        page_height: 842.0,
      };
      fetchSpy.mockResolvedValueOnce(createJsonResponse(pagePayload));

      const result = await api.getReaderPagePreview(1, 5);
      expect(result).toEqual(pagePayload);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/books/1/read/pages/5/?preview=1'),
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('throws when API access is disabled', async () => {
      __setHasApiForTesting(false);
      await expect(api.getReaderPagePreview(1, 1)).rejects.toThrow('BACKEND_NOT_CONFIGURED');
    });
  });
});
