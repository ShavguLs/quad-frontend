import type { User } from '../types';
import { clearCsrfToken, ensureCsrfToken } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://api.quaduni.com';
const AUTH_SESSION_HINT_KEY = 'quaduni.auth.hasSession';

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

const getSessionHintStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const hasAuthenticatedSessionHint = (): boolean => {
  const storage = getSessionHintStorage();
  return storage?.getItem(AUTH_SESSION_HINT_KEY) === 'true';
};

const setAuthenticatedSessionHint = (): void => {
  const storage = getSessionHintStorage();
  storage?.setItem(AUTH_SESSION_HINT_KEY, 'true');
};

const clearAuthenticatedSessionHint = (): void => {
  const storage = getSessionHintStorage();
  storage?.removeItem(AUTH_SESSION_HINT_KEY);
};

const buildCsrfHeaders = async (): Promise<Headers> => {
  const headers = new Headers();
  const csrfToken = await ensureCsrfToken();
  if (csrfToken) {
    headers.set('X-CSRFToken', csrfToken);
    return headers;
  }

  const cookieToken = getCookieValue('csrftoken');
  if (cookieToken) {
    headers.set('X-CSRFToken', cookieToken);
  }

  return headers;
};

// Internal function to perform the actual refresh request
const doRefresh = async (): Promise<boolean> => {
  try {
    const headers = await buildCsrfHeaders();

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
  refreshPromise = doRefresh().then(async (success) => {
    if (success) {
      // Refresh CSRF token after successful token refresh
      await ensureCsrfToken();
    }
    return success;
  }).finally(() => {
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
      if (!hasAuthenticatedSessionHint()) {
        return null;
      }

      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        clearAuthenticatedSessionHint();
        return null;
      }

      const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        clearAuthenticatedSessionHint();
        return null;
      }

      const data = await retryResponse.json().catch(() => null);
      const user = data?.user as User | null;

      if (!user) {
        clearAuthenticatedSessionHint();
        return null;
      }

      setAuthenticatedSessionHint();
      return user;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => null);
    const user = data?.user as User | undefined;

    if (!user) {
      clearAuthenticatedSessionHint();
      return null;
    }

    setAuthenticatedSessionHint();
    return user;
  },

  async login(payload: { email: string; password: string }): Promise<User> {
    const headers = await buildCsrfHeaders();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, 'AUTH_FAILED'));
    }

    const data = await response.json();
    await ensureCsrfToken();
    setAuthenticatedSessionHint();
    return data?.user as User;
  },

  async register(payload: { email: string; password: string; firstName: string; lastName: string; handle: string }): Promise<void> {
    const headers = await buildCsrfHeaders();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, 'REGISTRATION_FAILED'));
    }
    // Ensure CSRF token is loaded after successful registration
    await ensureCsrfToken();
  },

  async googleLogin(credential: string): Promise<User> {
    const headers = await buildCsrfHeaders();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, 'GOOGLE_AUTH_FAILED'));
    }

    const data = await response.json();
    await ensureCsrfToken();
    setAuthenticatedSessionHint();
    return data?.user as User;
  },

  async logout(): Promise<void> {
    await logout();
  }
};

// Standalone logout function for use by API interceptor
async function logout(): Promise<void> {
  const headers = await buildCsrfHeaders();

  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers,
  }).catch(() => undefined);

  clearCsrfToken();
  clearAuthenticatedSessionHint();
}

export { logout };
