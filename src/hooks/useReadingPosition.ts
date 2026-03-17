/**
 * useReadingPosition
 *
 * Manages a single persistent reading position per user per book,
 * stored in the backend so it syncs across all devices.
 *
 * - Authenticated: data fetched from and saved to the Django API.
 * - Unauthenticated: silently no-ops (guest flow is handled by prompting login).
 *
 * Optimistic updates keep the UI instant; API failures roll back.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

export interface ReadingPosition {
    pageNumber: number;
    updatedAt: string;
}

const storageKey = (bookId: string | number, userId: string) =>
    `bookers_reading_position_${userId}_${bookId}`;

const readStoredPosition = (bookId: string | number, userId: string): ReadingPosition | null => {
    try {
        const raw = localStorage.getItem(storageKey(bookId, userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<ReadingPosition>;
        const pageNumber = Number(parsed.pageNumber);
        if (!Number.isFinite(pageNumber) || pageNumber < 1) return null;
        return {
            pageNumber,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
        };
    } catch {
        return null;
    }
};

const writeStoredPosition = (bookId: string | number, userId: string, position: ReadingPosition) => {
    try {
        localStorage.setItem(storageKey(bookId, userId), JSON.stringify(position));
    } catch {
        // ignore storage errors
    }
};

const clearStoredPosition = (bookId: string | number, userId: string) => {
    try {
        localStorage.removeItem(storageKey(bookId, userId));
    } catch {
        // ignore storage errors
    }
};

export function useReadingPosition(bookId: string | number, user: User | null) {
    const [position, setPosition] = useState<ReadingPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialised, setInitialised] = useState(false);

    // ── Fetch on mount / user change ─────────────────────────────────────────
    useEffect(() => {
        if (!bookId || !user) {
            setPosition(null);
            setLoading(false);
            setInitialised(true);
            return;
        }

        const fallbackPosition = readStoredPosition(bookId, user.id);
        if (fallbackPosition) {
            setPosition(fallbackPosition);
        }

        let cancelled = false;
        setInitialised(false);
        setLoading(true);

        api.getReadingPosition(bookId).then((res) => {
            if (cancelled) return;
            if (res) {
                const serverPosition = { pageNumber: res.page_number, updatedAt: res.updated_at };
                setPosition(serverPosition);
                writeStoredPosition(bookId, user.id, serverPosition);
            } else {
                setPosition(fallbackPosition ?? null);
            }
            setInitialised(true);
            setLoading(false);
        }).catch(() => {
            if (!cancelled) {
                setPosition(fallbackPosition ?? null);
                setInitialised(true);
                setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [bookId, user]);

    // ── Mark a page as the reading position ──────────────────────────────────
    const markPage = useCallback(async (pageNumber: number) => {
        if (!user) return;

        // Optimistic update
        const previous = position;
        const optimistic = { pageNumber, updatedAt: new Date().toISOString() };
        setPosition(optimistic);
        writeStoredPosition(bookId, user.id, optimistic);

        try {
            const res = await api.setReadingPosition(bookId, pageNumber);
            const serverPosition = { pageNumber: res.page_number, updatedAt: res.updated_at };
            setPosition(serverPosition);
            writeStoredPosition(bookId, user.id, serverPosition);
        } catch {
            setPosition(previous); // rollback
            if (previous) {
                writeStoredPosition(bookId, user.id, previous);
            } else {
                clearStoredPosition(bookId, user.id);
            }
        }
    }, [bookId, user, position]);

    // ── Clear the position (unmark) ───────────────────────────────────────────
    const clearPosition = useCallback(async () => {
        if (!user) return;

        const previous = position;
        setPosition(null);
        clearStoredPosition(bookId, user.id);

        try {
            await api.clearReadingPosition(bookId);
        } catch {
            setPosition(previous); // rollback
            if (previous) {
                writeStoredPosition(bookId, user.id, previous);
            }
        }
    }, [bookId, user, position]);

    return {
        position,
        loading,
        initialised,
        markPage,
        clearPosition,
    };
}
