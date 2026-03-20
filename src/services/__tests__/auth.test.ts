import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { User } from '../../types';

const { ensureCsrfTokenMock, clearCsrfTokenMock } = vi.hoisted(() => ({
  ensureCsrfTokenMock: vi.fn<() => Promise<string | null>>(),
  clearCsrfTokenMock: vi.fn<() => void>(),
}));

vi.mock('../api', () => ({
  ensureCsrfToken: ensureCsrfTokenMock,
  clearCsrfToken: clearCsrfTokenMock,
}));

import { auth } from '../auth';

const AUTH_SESSION_HINT_KEY = 'quaduni.auth.hasSession';

const createJsonResponse = (payload: unknown, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(payload),
  text: () => Promise.resolve(JSON.stringify(payload)),
  headers: new Headers({ 'content-type': 'application/json' }),
} as Response);

describe('auth.getSession', () => {
  let fetchSpy: Mock;

  const mockUser: User = {
    id: '1',
    email: 'reader@example.com',
    name: 'Reader',
    handle: 'reader',
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
    ensureCsrfTokenMock.mockResolvedValue('csrf-token');
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns null without refreshing for anonymous bootstrap', async () => {
    await expect(auth.getSession()).resolves.toBeNull();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes and retries when a prior session hint exists', async () => {
    localStorage.setItem(AUTH_SESSION_HINT_KEY, 'true');
    fetchSpy
      .mockResolvedValueOnce(createJsonResponse({ detail: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(createJsonResponse({}, 200))
      .mockResolvedValueOnce(createJsonResponse({ user: mockUser }, 200));

    await expect(auth.getSession()).resolves.toEqual(mockUser);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls[1][0]).toContain('/auth/refresh');
    expect(fetchSpy.mock.calls[2][0]).toContain('/auth/me');
    expect(localStorage.getItem(AUTH_SESSION_HINT_KEY)).toBe('true');
  });

  it('returns null and clears the session hint when refresh fails', async () => {
    localStorage.setItem(AUTH_SESSION_HINT_KEY, 'true');
    fetchSpy
      .mockResolvedValueOnce(createJsonResponse({ detail: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(createJsonResponse({ error: 'Refresh token missing.' }, 400));

    await expect(auth.getSession()).resolves.toBeNull();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toContain('/auth/refresh');
    expect(localStorage.getItem(AUTH_SESSION_HINT_KEY)).toBeNull();
  });

  it('stores the session hint after a successful session fetch', async () => {
    localStorage.setItem(AUTH_SESSION_HINT_KEY, 'true');
    fetchSpy.mockResolvedValueOnce(createJsonResponse({ user: mockUser }, 200));

    await expect(auth.getSession()).resolves.toEqual(mockUser);

    expect(localStorage.getItem(AUTH_SESSION_HINT_KEY)).toBe('true');
  });
});
