import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

const mockEnv = {
  VITE_API_BASE_URL: 'https://api.example.com',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

import { api, clearCsrfToken, setCsrfToken, __resetHasApiForTesting } from '../api';

const createJsonResponse = (payload: unknown, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(payload),
  text: () => Promise.resolve(typeof payload === 'string' ? payload : JSON.stringify(payload)),
  headers: new Headers({ 'content-type': 'application/json' }),
} as Response);

describe('Books API', () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    setCsrfToken('test-csrf');
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(createJsonResponse({}));
  });

  afterEach(() => {
    clearCsrfToken();
    __resetHasApiForTesting();
    vi.clearAllMocks();
  });

  it('uploadBook appends render_preference to upload FormData', async () => {
    const pdfFile = new File(['pdf-content'], 'book.pdf', { type: 'application/pdf' });

    fetchSpy
      .mockResolvedValueOnce(createJsonResponse({ id: 12 }, 201))
      .mockResolvedValueOnce(createJsonResponse({ extraction_status: 'processing' }, 202));

    await api.uploadBook(
      {
        title: 'Test Book',
        author: 'Author',
        description: 'Desc',
        price: '10.00',
        category: 'წიგნები',
        accessType: 'educational',
        renderPreference: 'exact_visual',
      },
      { pdf: pdfFile }
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const uploadRequest = fetchSpy.mock.calls.find(([url]) => String(url).includes('/books/12/upload/'));
    expect(uploadRequest).toBeDefined();
    const uploadBody = uploadRequest?.[1]?.body as FormData;
    expect(uploadBody.get('file')).toBe(pdfFile);
    expect(uploadBody.get('render_preference')).toBe('exact_visual');
  });

  it('updateBook forwards render_preference when uploading replacement PDF', async () => {
    const pdfFile = new File(['pdf-content'], 'replacement.pdf', { type: 'application/pdf' });

    fetchSpy
      .mockResolvedValueOnce(createJsonResponse({}, 200))
      .mockResolvedValueOnce(createJsonResponse({ extraction_status: 'processing' }, 202));

    await api.updateBook(
      42,
      { renderPreference: 'text' },
      { pdf: pdfFile }
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const uploadRequest = fetchSpy.mock.calls.find(([url]) => String(url).includes('/books/42/upload/'));
    expect(uploadRequest).toBeDefined();
    const uploadBody = uploadRequest?.[1]?.body as FormData;
    expect(uploadBody.get('file')).toBe(pdfFile);
    expect(uploadBody.get('render_preference')).toBe('text');
  });
});
