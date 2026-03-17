import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { useReadingSession } from '../useReadingSession';

describe('useReadingSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('loads the initial session page from storage', () => {
    sessionStorage.setItem('bookers_session_42', '7');

    const { result } = renderHook(() => useReadingSession('42'));

    expect(result.current.lastSessionPage).toBe(7);
  });

  it('updates state and storage when saving a page', () => {
    const { result } = renderHook(() => useReadingSession('42'));

    act(() => {
      result.current.saveSessionPage(9);
    });

    expect(result.current.lastSessionPage).toBe(9);
    expect(sessionStorage.getItem('bookers_session_42')).toBe('9');
  });

  it('ignores invalid pages', () => {
    const { result } = renderHook(() => useReadingSession('42'));

    act(() => {
      result.current.saveSessionPage(0);
    });

    expect(result.current.lastSessionPage).toBeNull();
    expect(sessionStorage.getItem('bookers_session_42')).toBeNull();
  });

  it('clears state and storage', () => {
    sessionStorage.setItem('bookers_session_42', '4');
    const { result } = renderHook(() => useReadingSession('42'));

    act(() => {
      result.current.clearSessionPage();
    });

    expect(result.current.lastSessionPage).toBeNull();
    expect(sessionStorage.getItem('bookers_session_42')).toBeNull();
  });

  it('reloads session value when book id changes', () => {
    sessionStorage.setItem('bookers_session_42', '3');
    sessionStorage.setItem('bookers_session_43', '8');

    const { result, rerender } = renderHook(
      ({ bookId }) => useReadingSession(bookId),
      { initialProps: { bookId: '42' } },
    );

    expect(result.current.lastSessionPage).toBe(3);

    rerender({ bookId: '43' });

    expect(result.current.lastSessionPage).toBe(8);
  });
});
