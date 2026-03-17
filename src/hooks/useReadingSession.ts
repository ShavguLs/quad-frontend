/**
 * useReadingSession
 *
 * Remembers which page the user was on for a given book during the current
 * browser session (sessionStorage clears automatically when the tab/window
 * is closed — no manual cleanup needed).
 *
 * Usage in the reader:
 *  1. Call `saveSessionPage(pageNumber)` on every page navigation.
 *  2. On mount, read `lastSessionPage` — if it's > 1 show a "Resume?" banner.
 *  3. Call `clearSessionPage()` when the user chooses "Start fresh" or finishes.
 */

import { useCallback, useEffect, useState } from 'react';

const sessionKey = (bookId: string | number) =>
    `bookers_session_${bookId}`;

export interface ReadingSession {
    /** The last page visited this session, or null if this is a fresh open. */
    lastSessionPage: number | null;
    /** Call on every page navigation to keep the session up to date. */
    saveSessionPage: (page: number) => void;
    /** Wipe the stored session (user chose to start fresh or finished the book). */
    clearSessionPage: () => void;
}

const readSessionPage = (key: string): number | null => {
    try {
        const raw = sessionStorage.getItem(key);
        const n = raw ? parseInt(raw, 10) : NaN;
        return Number.isFinite(n) && n >= 1 ? n : null;
    } catch {
        return null;
    }
};

export function useReadingSession(bookId: string | number): ReadingSession {
    const key = sessionKey(bookId);

    const [lastSessionPage, setLastSessionPage] = useState<number | null>(() => readSessionPage(key));

    useEffect(() => {
        setLastSessionPage(readSessionPage(key));
    }, [key]);

    const saveSessionPage = useCallback((page: number) => {
        if (!Number.isFinite(page) || page < 1) return;

        try {
            sessionStorage.setItem(key, String(page));
            setLastSessionPage(page);
        } catch {
            // storage unavailable — ignore
        }
    }, [key]);

    const clearSessionPage = useCallback(() => {
        try {
            sessionStorage.removeItem(key);
        } catch {
            // ignore
        } finally {
            setLastSessionPage(null);
        }
    }, [key]);

    return { lastSessionPage, saveSessionPage, clearSessionPage };
}
