// BookThemeContext - React Context for book theme state management
// Provides theme state, update methods, and persistence via API

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { BookTheme } from '../types/bookTheme';
import { DEFAULT_THEME } from '../types/bookTheme';
import { getAccessToken } from '../services/auth';

/** Context value type */
export interface BookThemeContextValue {
  /** Current/active theme configuration (applied to editor) */
  theme: BookTheme;
  /** Staged/pending theme configuration (for preview before apply) */
  pendingTheme: BookTheme;
  /** Replace entire active theme */
  setTheme: (theme: BookTheme) => void;
  /** Partial theme update (merges with current active theme) */
  updateTheme: (updates: Partial<BookTheme>) => void;
  /** Stage theme changes without applying (modifies pendingTheme only) */
  setPendingTheme: (updates: Partial<BookTheme>) => void;
  /** Apply pending theme changes to active theme */
  applyTheme: () => void;
  /** Discard pending changes and reset to active theme */
  discardPendingTheme: () => void;
  /** Loading state during API operations */
  isLoading: boolean;
  /** Persist active theme to backend */
  saveTheme: () => Promise<void>;
  /** Whether pending theme differs from active theme */
  hasPendingChanges: boolean;
  /** Whether active theme has unsaved changes vs backend */
  hasChanges: boolean;
  /** Error message if loading/saving failed */
  error: string | null;
}

/** Context object */
const BookThemeContext = createContext<BookThemeContextValue | null>(null);

/** Hook to access BookThemeContext - throws if used outside provider */
export function useBookTheme(): BookThemeContextValue {
  const context = useContext(BookThemeContext);
  if (!context) {
    throw new Error('useBookTheme must be used within a BookThemeProvider');
  }
  return context;
}

/** Provider props */
interface BookThemeProviderProps {
  /** Book ID for theme persistence */
  bookId: string;
  /** Child components */
  children: React.ReactNode;
  /** Optional initial theme (overrides default) */
  initialTheme?: BookTheme;
}

/** API base URL for theme persistence endpoints */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://enquad-1bbee1f617a7.herokuapp.com';

/**
 * BookThemeProvider - Manages theme state and persistence
 *
 * Pattern: React Context for state sharing (similar to EditorProvider from Phase 37)
 * Loads theme from API on mount, provides update methods, saves on demand
 */
export function BookThemeProvider({
  bookId,
  children,
  initialTheme,
}: BookThemeProviderProps): React.ReactElement {
  // Theme state
  const [theme, setThemeState] = useState<BookTheme>(initialTheme || DEFAULT_THEME);
  const [pendingTheme, setPendingThemeState] = useState<BookTheme>(initialTheme || DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load theme from API on mount
  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      setIsLoading(true);
      setError(null);

      try {
        const token = getAccessToken();
        const response = await fetch(`${API_BASE_URL}/books/${bookId}/theme/`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
        });

        if (!cancelled) {
          if (response.ok) {
            const data = await response.json();
            const loadedTheme = {
              paperBackground: data.paper_background || DEFAULT_THEME.paperBackground,
              fontFamily: data.font_family || DEFAULT_THEME.fontFamily,
            };
            setThemeState(loadedTheme);
            setPendingThemeState(loadedTheme);
            setHasChanges(false);
            setHasPendingChanges(false);
          } else if (response.status === 404) {
            // Theme not set yet - use default
            setThemeState(DEFAULT_THEME);
            setPendingThemeState(DEFAULT_THEME);
            setHasChanges(false);
            setHasPendingChanges(false);
          } else {
            const errorData = await response.json().catch(() => ({}));
            setError(errorData.detail || `Failed to load theme: ${response.status}`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load theme');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (bookId) {
      loadTheme();
    }

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // Replace entire theme
  const setTheme = useCallback((newTheme: BookTheme) => {
    setThemeState(newTheme);
    setHasChanges(true);
    setError(null);
  }, []);

  // Partial theme update (merges with current active theme)
  const updateTheme = useCallback((updates: Partial<BookTheme>) => {
    setThemeState(current => ({ ...current, ...updates }));
    setHasChanges(true);
    setError(null);
  }, []);

  // Stage theme changes (modifies pendingTheme only, doesn't affect active theme)
  const setPendingTheme = useCallback((updates: Partial<BookTheme>) => {
    setPendingThemeState(current => ({ ...current, ...updates }));
    setHasPendingChanges(true);
    setError(null);
  }, []);

  // Apply pending theme changes to active theme
  const applyTheme = useCallback(() => {
    setThemeState(pendingTheme);
    setHasPendingChanges(false);
    setHasChanges(true);
    setError(null);
  }, [pendingTheme]);

  // Discard pending changes and reset to active theme
  const discardPendingTheme = useCallback(() => {
    setPendingThemeState(theme);
    setHasPendingChanges(false);
    setError(null);
  }, [theme]);

  // Persist theme to backend
  const saveTheme = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/books/${bookId}/theme/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          paper_background: theme.paperBackground,
          font_family: theme.fontFamily,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to save theme: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [bookId, theme]);

  const value: BookThemeContextValue = {
    theme,
    pendingTheme,
    setTheme,
    updateTheme,
    setPendingTheme,
    applyTheme,
    discardPendingTheme,
    isLoading,
    saveTheme,
    hasPendingChanges,
    hasChanges,
    error,
  };

  return (
    <BookThemeContext.Provider value={value}>
      {children}
    </BookThemeContext.Provider>
  );
}

// Re-export context for advanced use cases
export { BookThemeContext };
