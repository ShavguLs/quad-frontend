/**
 * useSavedPages — backend-persisted reader bookmarks.
 *
 * Behaviour:
 *  - Authenticated users: data lives in the Django backend (synced across devices).
 *    Optimistic updates keep the UI instant; failures roll back.
 *  - Unauthenticated users: localStorage fallback (will be prompted to log in on save).
 *
 * Max 10 saved pages per book is enforced by both the backend and the hook.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

export interface SavedPage {
    id?: number;          // undefined for optimistic / localStorage entries
    bookId: string | number;
    pageNumber: number;
    savedAt: string;      // ISO string
}

const MAX_SAVED_PAGES = 10;

// ── localStorage helpers (unauthenticated fallback) ──────────────────────────

const LS_KEY = (bookId: string | number) => `bookers_saved_pages_${bookId}`;

function lsLoad(bookId: string | number): SavedPage[] {
    try {
        const raw = localStorage.getItem(LS_KEY(bookId));
        return raw ? (JSON.parse(raw) as SavedPage[]) : [];
    } catch {
        return [];
    }
}

function lsSave(bookId: string | number, pages: SavedPage[]) {
    try {
        localStorage.setItem(LS_KEY(bookId), JSON.stringify(pages));
    } catch {
        // quota exceeded — silently ignore
    }
}

function lsClear(bookId: string | number) {
    try {
        localStorage.removeItem(LS_KEY(bookId));
    } catch {
        // ignore storage errors
    }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSavedPages(
    bookId: string | number,
    bookTitle: string,
    user: User | null,
) {
    const [savedPages, setSavedPages] = useState<SavedPage[]>([]);
    const [loading, setLoading] = useState(false);
    const loadedRef = useRef<string | number | null>(null);

    // ── Fetch from backend (authenticated) or localStorage ──────────────────
    useEffect(() => {
        if (!bookId) return;

        // Reset when the book changes
        if (loadedRef.current !== bookId) {
            setSavedPages([]);
            loadedRef.current = null;
        }

        let cancelled = false;

        const load = async () => {
            if (!user) {
                // Not logged in — use localStorage
                setSavedPages(lsLoad(bookId));
                loadedRef.current = bookId;
                return;
            }

            setLoading(true);
            try {
                const resp = await api.getSavedPages(bookId);
                if (cancelled) return;
                const pages: SavedPage[] = resp.results.map((r) => ({
                    id: r.id,
                    bookId,
                    pageNumber: r.page_number,
                    savedAt: r.created_at,
                }));
                setSavedPages(pages);
                loadedRef.current = bookId;
            } catch {
                if (!cancelled) setSavedPages([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [bookId, user]);

    // ── Derived helpers ──────────────────────────────────────────────────────
    const isPageSaved = useCallback(
        (pageNumber: number) => savedPages.some((p) => p.pageNumber === pageNumber),
        [savedPages],
    );

    const canSaveMore = savedPages.length < MAX_SAVED_PAGES;

    // ── Toggle (optimistic) ──────────────────────────────────────────────────
    const toggleSavePage = useCallback(
        async (pageNumber: number): Promise<{ success: boolean; reason?: string }> => {
            const alreadySaved = savedPages.some((p) => p.pageNumber === pageNumber);

            if (alreadySaved) {
                // ── Unsave — optimistic remove ──
                const previous = savedPages;
                const updated = savedPages.filter((p) => p.pageNumber !== pageNumber);
                setSavedPages(updated);

                if (!user) {
                    lsSave(bookId, updated);
                    return { success: true };
                }

                try {
                    await api.unsavePage(bookId, pageNumber);
                    return { success: true };
                } catch {
                    setSavedPages(previous); // rollback
                    return { success: false, reason: 'Could not remove saved page. Please try again.' };
                }
            }

            // ── Save ──
            if (savedPages.length >= MAX_SAVED_PAGES) {
                return {
                    success: false,
                    reason: `Max ${MAX_SAVED_PAGES} saved pages reached. Remove one first.`,
                };
            }

            const optimistic: SavedPage = {
                bookId,
                pageNumber,
                savedAt: new Date().toISOString(),
            };
            const updated = [...savedPages, optimistic].sort((a, b) => a.pageNumber - b.pageNumber);
            setSavedPages(updated);

            if (!user) {
                lsSave(bookId, updated);
                return { success: true };
            }

            try {
                const saved = await api.savePage(bookId, pageNumber);
                setSavedPages((prev) =>
                    prev.map((p) =>
                        p.pageNumber === pageNumber
                            ? { ...p, id: saved.id, savedAt: saved.created_at }
                            : p,
                    ),
                );
                return { success: true };
            } catch (err: unknown) {
                // Check if the backend rejected because of max limit or conflict
                const message =
                    err instanceof Error ? err.message : '';
                const isMaxReached =
                    message.toLowerCase().includes('max') ||
                    message.toLowerCase().includes('10') ||
                    message.toLowerCase().includes('remove');

                // Rollback optimistic update
                setSavedPages(savedPages);
                return {
                    success: false,
                    reason: isMaxReached
                        ? `Max ${MAX_SAVED_PAGES} saved pages reached. Remove one first.`
                        : 'Could not save page. Please try again.',
                };
            }
        },
        [savedPages, bookId, user],
    );

    // ── Remove single (used by panel X button) ───────────────────────────────
    const removeSavedPage = useCallback(
        async (pageNumber: number) => {
            const previous = savedPages;
            const updated = savedPages.filter((p) => p.pageNumber !== pageNumber);
            setSavedPages(updated);

            if (!user) {
                lsSave(bookId, updated);
                return;
            }

            try {
                await api.unsavePage(bookId, pageNumber);
            } catch {
                setSavedPages(previous); // rollback
            }
        },
        [savedPages, bookId, user],
    );

    // ── Clear all ────────────────────────────────────────────────────────────
    const clearAllSavedPages = useCallback(async () => {
        const previous = savedPages;
        setSavedPages([]);

        if (!user) {
            lsClear(bookId);
            return;
        }

        try {
            await api.clearSavedPages(bookId);
        } catch {
            setSavedPages(previous); // rollback
        }
    }, [savedPages, bookId, user]);

    return {
        savedPages,
        loading,
        isPageSaved,
        canSaveMore,
        toggleSavePage,
        removeSavedPage,
        clearAllSavedPages,
        maxSavedPages: MAX_SAVED_PAGES,
    };
}
