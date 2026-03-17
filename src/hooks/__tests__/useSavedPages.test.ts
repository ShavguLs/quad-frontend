import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSavedPages } from '../useSavedPages';

vi.mock('../../services/api', () => ({
  api: {
    getSavedPages: vi.fn(),
    savePage: vi.fn(),
    unsavePage: vi.fn(),
    clearSavedPages: vi.fn(),
  },
}));

describe('useSavedPages', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads from localStorage for unauthenticated users', async () => {
    localStorage.setItem(
      'bookers_saved_pages_12',
      JSON.stringify([
        { bookId: '12', pageNumber: 5, savedAt: '2026-01-01T00:00:00.000Z' },
      ]),
    );

    const { result } = renderHook(() => useSavedPages('12', 'Demo', null));

    await waitFor(() => {
      expect(result.current.savedPages).toHaveLength(1);
    });

    expect(result.current.savedPages[0]?.pageNumber).toBe(5);
  });

  it('toggles save and unsave in localStorage for unauthenticated users', async () => {
    const { result } = renderHook(() => useSavedPages('12', 'Demo', null));

    await act(async () => {
      await result.current.toggleSavePage(7);
    });

    expect(result.current.savedPages.map((p) => p.pageNumber)).toEqual([7]);
    expect(localStorage.getItem('bookers_saved_pages_12')).toContain('"pageNumber":7');

    await act(async () => {
      await result.current.toggleSavePage(7);
    });

    expect(result.current.savedPages).toEqual([]);
    expect(localStorage.getItem('bookers_saved_pages_12')).toBe('[]');
  });

  it('does not throw when clear hits storage errors', async () => {
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useSavedPages('12', 'Demo', null));

    await act(async () => {
      await result.current.toggleSavePage(7);
    });

    await act(async () => {
      await expect(result.current.clearAllSavedPages()).resolves.toBeUndefined();
    });

    await waitFor(() => {
      expect(result.current.savedPages).toEqual([]);
    });

    removeSpy.mockRestore();
  });
});
