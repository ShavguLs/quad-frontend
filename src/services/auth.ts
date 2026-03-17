import type { User } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://enquad-1bbee1f617a7.herokuapp.com';

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const record = data as Record<string, unknown>;
  const pickMessage = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
    }
    return null;
  };

  return pickMessage(record.error) || pickMessage(record.message) || fallback;
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

// Refresh state tracking for coordinating concurrent refresh requests
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Internal function to perform the actual refresh request
const doRefresh = async (): Promise<boolean> => {
  try {
    const headers = new Headers();
    const csrfToken = getCookieValue('csrftoken');
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    return response.ok;
  } catch {
    return false;
  }
};

// Public function that coordinates refresh requests to prevent duplicates
export const refreshAccessToken = async (): Promise<boolean> => {
  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
};

export const auth = {
  async getSession(): Promise<User | null> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });

    if (response.status === 401) {
      // Try to refresh the token
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }

      // Retry with refreshed cookies
      const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        return null;
      }

      const data = await retryResponse.json().catch(() => null);
      return data?.user as User | null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => null);
    const user = data?.user as User | undefined;

    if (!user) {
      return null;
    }

    return user;
  },

  async login(payload: { email: string; password: string }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, 'AUTH_FAILED'));
    }

    const data = await response.json();
    return data?.user as User;
  },

  async register(payload: { email: string; password: string; firstName: string; lastName: string; handle: string }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, 'REGISTRATION_FAILED'));
    }
  },

  async logout(): Promise<void> {
    await logout();
  }
};

// Standalone logout function for use by API interceptor
async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
}

export { logout };
