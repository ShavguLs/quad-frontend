import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { User } from '../../types';

// Mock import.meta.env
const mockEnv = {
  VITE_API_BASE_URL: 'https://api.example.com',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

// Import api after mocks
import {
  api,
  __resetHasApiForTesting,
  __setHasApiForTesting,
  clearCsrfToken,
  setCsrfToken,
} from '../api';

const createJsonResponse = (payload: unknown, status = 200, headers?: HeadersInit): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(payload),
  text: () => Promise.resolve(typeof payload === 'string' ? payload : JSON.stringify(payload)),
  headers: new Headers(headers),
} as Response);

const createTextResponse = (text: string, status = 500): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.reject(new Error('Not JSON')),
  text: () => Promise.resolve(text),
  headers: new Headers({ 'content-type': 'text/plain' }),
} as Response);

describe('Profile API', () => {
  let fetchSpy: Mock;

  const getProfilePatchRequestOptions = (): RequestInit => {
    const call = fetchSpy.mock.calls.find(([url, options]) => {
      const method = (options as RequestInit | undefined)?.method;
      return typeof url === 'string' && url.includes('/profile') && method === 'PATCH';
    });

    expect(call).toBeDefined();
    return (call?.[1] || {}) as RequestInit;
  };

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    handle: 'testuser',
    bio: 'Test bio',
    profileImage: 'https://api.example.com/media/users/avatars/test.jpg',
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    setCsrfToken('test-csrf');
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      createJsonResponse({ user: mockUser })
    );
  });

  afterEach(() => {
    clearCsrfToken();
    __resetHasApiForTesting();
    vi.clearAllMocks();
  });

  describe('updateProfile - Basic Functionality', () => {
    it('should update profile with name and bio only', async () => {
      const expectedBody = JSON.stringify({ name: 'Updated Name', bio: 'Updated bio' });
      const result = await api.updateProfile({ name: 'Updated Name', bio: 'Updated bio' });

      const requestBody = getProfilePatchRequestOptions().body as string;
      expect(requestBody).toBe(expectedBody);
      expect(result.name).toBe('Test User');
    });

    it('should update profile with profile image', async () => {
      const file = new File(['image content'], 'avatar.png', { type: 'image/png' });
      fetchSpy.mockResolvedValueOnce(createJsonResponse({ user: mockUser }));

      await api.updateProfile({ profileImage: file });

      const body = getProfilePatchRequestOptions().body as FormData;
      const entries = Array.from(body.entries());
      expect(entries).toEqual([[ 'profile_image', file ]]);
    });

    it('should update profile with all fields', async () => {
      const file = new File(['binary'], 'avatar.png', { type: 'image/png' });
      fetchSpy.mockResolvedValueOnce(createJsonResponse({ user: mockUser }));

      await api.updateProfile({ name: 'Updated Name', bio: 'New bio', profileImage: file });

      const body = getProfilePatchRequestOptions().body as FormData;
      const entries = Array.from(body.entries());
      expect(entries).toEqual([
        ['name', 'Updated Name'],
        ['bio', 'New bio'],
        ['profile_image', file],
      ]);
    });

    it('should handle partial updates', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse({ user: mockUser }));

      await api.updateProfile({ bio: 'Updated bio only' });

      const requestBody = getProfilePatchRequestOptions().body as string;
      expect(requestBody).toBe(JSON.stringify({ bio: 'Updated bio only' }));
    });

    it('should handle null profileImage', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse({ user: mockUser }));

      await api.updateProfile({ bio: 'Bio only', profileImage: null });

      const requestBody = getProfilePatchRequestOptions().body as string;
      expect(requestBody).toBe(JSON.stringify({ bio: 'Bio only' }));
    });
  });

  describe('updateProfile - Response Handling', () => {
    it('should normalize profileImage in response', async () => {
      const responseUser = { ...mockUser, profileImage: undefined, profile_image: 'https://cdn.example.com/avatar-new.jpg' };
      fetchSpy.mockResolvedValueOnce(createJsonResponse(responseUser));

      const result = await api.updateProfile({ bio: 'Normalization' });

      expect(result.profileImage).toBe(responseUser.profile_image);
      expect(result.profile_image).toBe(responseUser.profile_image);
    });

    it('should handle response with user wrapper', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse({ user: mockUser }));

      const result = await api.updateProfile({ bio: 'Wrapper' });

      expect(result.id).toBe(mockUser.id);
    });

    it('should handle direct User response', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse(mockUser));

      const result = await api.updateProfile({ bio: 'Direct' });

      expect(result.id).toBe(mockUser.id);
    });

    it('should throw PROFILE_UPDATE_FAILED when no user in response', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse(null, 200));

      await expect(api.updateProfile({ bio: 'Broken' })).rejects.toThrow('PROFILE_UPDATE_FAILED');
    });
  });

  describe('updateProfile - Error Handling', () => {
    it('should throw error on 400 validation error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Name is required' }),
        text: () => Promise.resolve('Name is required'),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(api.updateProfile({ bio: '' })).rejects.toThrow('Name is required');
    });

    it('should throw error on 401 unauthorized', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: 'Unauthorized' }),
          text: () => Promise.resolve('Unauthorized'),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response)
        .mockResolvedValueOnce(createJsonResponse({}, 200))
        .mockResolvedValueOnce(createJsonResponse(mockUser));

      const result = await api.updateProfile({ bio: 'Retry' });

      expect(result.id).toBe(mockUser.id);
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      const calls = fetchSpy.mock.calls;
      expect(calls[0][0]).toEqual(expect.stringContaining('/profile'));
      expect(calls[1][0]).toEqual(expect.stringContaining('/auth/refresh'));
      expect(calls[2][0]).toEqual(expect.stringContaining('/profile'));
      expect(calls[1][1]).toEqual(expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }));
    });

    it('should throw error on 500 server error', async () => {
      fetchSpy.mockResolvedValueOnce(createTextResponse('Server exploded', 500));

      await expect(api.updateProfile({ bio: 'Crash' })).rejects.toThrow('Server exploded');
    });

    it('should throw BACKEND_NOT_CONFIGURED when no API', async () => {
      __setHasApiForTesting(false);
      try {
        await expect(api.updateProfile({ bio: 'No API' })).rejects.toThrow('BACKEND_NOT_CONFIGURED');
      } finally {
        __resetHasApiForTesting();
      }
    });
  });

  describe('updateProfile - Request Format', () => {
    it('should use FormData when profileImage is provided', async () => {
      const file = new File(['content'], 'avatar.png', { type: 'image/png' });
      fetchSpy.mockResolvedValueOnce(createJsonResponse(mockUser));

      await api.updateProfile({ profileImage: file });

      const options = getProfilePatchRequestOptions();
      expect(options.method).toBe('PATCH');
      const body = options.body as FormData;
      expect(body).toBeInstanceOf(FormData);
      const headers = new Headers(options.headers as HeadersInit);
      expect(headers.has('Content-Type')).toBe(false);
      expect(options.credentials).toBe('include');
    });

    it('should use JSON when no profileImage', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse(mockUser));

      await api.updateProfile({ bio: 'JSON only' });

      const options = getProfilePatchRequestOptions();
      const headers = new Headers(options.headers as HeadersInit);
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should include credentials for cookie auth', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse(mockUser));

      await api.updateProfile({ bio: 'Auth check' });

      const options = getProfilePatchRequestOptions();
      expect(options.credentials).toBe('include');
    });

    it('should use PATCH method', async () => {
      fetchSpy.mockResolvedValueOnce(createJsonResponse(mockUser));

      await api.updateProfile({ bio: 'Method' });

      const options = getProfilePatchRequestOptions();
      expect(options.method).toBe('PATCH');
    });
  });
});
