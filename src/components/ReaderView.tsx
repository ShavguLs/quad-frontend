import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Loader2, ChevronLeft, ChevronRight, Lock, BookmarkCheck, Bookmark, X, MapPin, Maximize, Minimize } from 'lucide-react';
import { useSavedPages } from '../hooks/useSavedPages';
import { useReadingSession } from '../hooks/useReadingSession';
import { useReadingPosition } from '../hooks/useReadingPosition';
import { api } from '../services/api';
import { sanitizeBookHTML } from '../services/htmlSanitizer';
import type { Book, ReaderManifest, ReaderPageResponse, User as AppUser } from '../types';
import {
    getFontById,
    getPaletteById,
    getAnimationById,
    getPaperById,
    getBackgroundById,
} from '../constants/draftStudioTheme';
import type { DraftStudioTheme, AnimationEffect } from '../constants/draftStudioTheme';
import { PaperTextureOverlay } from './PaperTextureOverlay';

/* ── Reader Animation Overlay ── */
const ReaderAnimationOverlay: React.FC<{ effect: AnimationEffect; accent: string }> = ({ effect, accent }) => {
    if (effect === 'none') return null;

    const particles = useMemo(() => {
        if (effect === 'snow') {
            return Array.from({ length: 45 }, (_, i) => {
                const dur = 8 + Math.random() * 10;
                return {
                    id: i,
                    x: Math.random() * 100,
                    y: -5,
                    originX: 0,
                    originY: 0,
                    isPlanet: false,
                    size: 6 + Math.random() * 5,
                    delay: -(Math.random() * dur),
                    duration: dur,
                };
            });
        }
        if (effect === 'flare') {
            return Array.from({ length: 5 }, (_, i) => {
                const dur = 15 + Math.random() * 15;
                return {
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    originX: 0,
                    originY: 0,
                    isPlanet: false,
                    size: 30 + Math.random() * 40,
                    delay: -(Math.random() * dur),
                    duration: dur,
                };
            });
        }
        if (effect === 'vortex') {
            const stars = Array.from({ length: 72 }, (_, i) => ({
                id: `star-${i}`,
                type: 'star',
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 0.8 + Math.random() * 2.2,
                opacity: 0.25 + Math.random() * 0.65,
                duration: 2.2 + Math.random() * 3.8,
                delay: -(Math.random() * 4),
            }));

            const nebulae = [
                { id: 'nebula-1', type: 'nebula', x: 22, y: 24, size: 420, opacity: 0.16, color: '#2f7fff' },
                { id: 'nebula-2', type: 'nebula', x: 78, y: 70, size: 460, opacity: 0.14, color: '#8c4bff' },
                { id: 'nebula-3', type: 'nebula', x: 52, y: 48, size: 360, opacity: 0.1, color: '#42d7ff' },
            ];

            const comets = Array.from({ length: 4 }, (_, i) => ({
                id: `comet-${i}`,
                type: 'comet',
                y: 8 + Math.random() * 55,
                duration: 5 + Math.random() * 4,
                delay: i * 2.8 + Math.random() * 2,
                length: 90 + Math.random() * 50,
            }));

            return [
                ...stars,
                ...nebulae,
                ...comets,
                { id: 'core', type: 'core', x: 50, y: 50 },
            ];
        }
        if (effect === 'sparkle') {
            return Array.from({ length: 45 }, (_, i) => {
                const dur = 2.5 + Math.random() * 3;
                return {
                    id: i,
                    x: Math.random() * 100,
                    y: 70 + Math.random() * 40,
                    originX: (Math.random() - 0.5) * 20,
                    originY: 0,
                    isPlanet: false,
                    size: 2 + Math.random() * 4,
                    delay: -(Math.random() * dur),
                    duration: dur,
                };
            });
        }
        return [];
    }, [effect]);

    return (
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
            {effect === 'flare' && particles.map((p: any) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}vh`,
                        height: `${p.size}vh`,
                        background: `radial-gradient(circle, ${accent}80 0%, transparent 70%)`,
                        filter: 'blur(40px)',
                        mixBlendMode: 'screen',
                        animation: `readerFlare ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                        willChange: 'transform, opacity',
                    }}
                />
            ))}

            {effect === 'snow' && particles.map((p: any) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
                        animation: `readerSnow ${p.duration}s linear ${p.delay}s infinite`,
                        willChange: 'transform',
                    }}
                />
            ))}

            {effect === 'vortex' && (
                <>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: `radial-gradient(ellipse at 50% 120%, ${accent}22 0%, rgba(20,40,90,0.12) 45%, rgba(0,0,0,0) 85%)`,
                        }}
                    />

                    {particles.filter((p: any) => p.type === 'nebula').map((p: any) => (
                        <div
                            key={p.id}
                            style={{
                                position: 'absolute',
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                transform: 'translate(-50%, -50%)',
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
                                opacity: p.opacity,
                                animation: 'galaxyNebulaDrift 18s ease-in-out infinite alternate',
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {particles.filter((p: any) => p.type === 'core').map((p: any) => (
                        <div
                            key={p.id}
                            style={{
                                position: 'absolute',
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: '140px',
                                height: '140px',
                                transform: 'translate(-50%, -50%)',
                                borderRadius: '50%',
                                background: `radial-gradient(circle at 35% 35%, #fff 0%, ${accent} 30%, transparent 72%)`,
                                opacity: 0.35,
                                animation: 'galaxyCorePulse 4.5s ease-in-out infinite',
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {particles.filter((p: any) => p.type === 'star').map((p: any) => (
                        <div
                            key={p.id}
                            style={{
                                position: 'absolute',
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                backgroundColor: '#ffffff',
                                opacity: p.opacity,
                                borderRadius: '50%',
                                boxShadow: `0 0 ${Math.max(2, p.size * 2)}px rgba(255,255,255,0.55)`,
                                animation: `galaxyTwinkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {particles.filter((p: any) => p.type === 'comet').map((p: any) => (
                        <div
                            key={p.id}
                            style={{
                                position: 'absolute',
                                left: '110%',
                                top: `${p.y}%`,
                                width: `${p.length}px`,
                                height: '2px',
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 45%, transparent 100%)',
                                transform: 'rotate(-20deg)',
                                animation: `galaxyComet ${p.duration}s linear ${p.delay}s infinite`,
                                pointerEvents: 'none',
                            }}
                        />
                    ))}
                </>
            )}

            {effect === 'sparkle' && particles.map((p: any) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: '#ffdb58',
                        boxShadow: `0 0 ${p.size * 2}px ${p.size * 2}px #ff4500`,
                        filter: 'blur(1px)',
                        mixBlendMode: 'screen',
                        animation: `readerSparkle ${p.duration}s ease-in ${p.delay}s infinite`,
                        willChange: 'transform, opacity',
                        ['--drift' as any]: `${p.originX}vw`,
                    }}
                />
            ))}

            <style>{`
        @keyframes readerFlare {
          0% { transform: translate(-10vw, -10vh) scale(0.8); opacity: 0.2; }
          50% { transform: translate(5vw, 5vh) scale(1.1); opacity: 0.5; }
          100% { transform: translate(10vw, -5vh) scale(0.9); opacity: 0.2; }
        }
        @keyframes readerSnow {
          0% { transform: translateY(-5vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          50% { transform: translateY(50vh) translateX(15px) rotate(180deg); opacity: 0.7; }
          90% { opacity: 0.9; }
          100% { transform: translateY(110vh) translateX(-15px) rotate(360deg); opacity: 0; }
        }
        @keyframes readerPlanet {
          0% { transform: translateY(-3vh) rotate(0deg); }
          100% { transform: translateY(3vh) rotate(15deg); }
        }
        @keyframes readerStar {
          0% { transform: scale(0.8); opacity: 0.2; }
          100% { transform: scale(1.5); opacity: 0.8; }
        }
        @keyframes readerSparkle {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          15% { opacity: 1; transform: translate(calc(var(--drift) * 0.1), -5vh) scale(1.4); }
          50% { opacity: 0.9; transform: translate(calc(var(--drift) * 0.5), -15vh) scale(1.1); }
          100% { transform: translate(var(--drift), -40vh) scale(0); opacity: 0; }
        }
        /* Galaxy Animation Styles */
        @keyframes galaxyTwinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes galaxyCorePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.45; }
        }
        @keyframes galaxyNebulaDrift {
          0% { transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1); }
          100% { transform: translate(-50%, -50%) translate3d(16px, -10px, 0) scale(1.06); }
        }
        @keyframes galaxyComet {
          0% { transform: translate3d(0, 0, 0) rotate(-20deg); opacity: 0; }
          8% { opacity: 0.95; }
          92% { opacity: 0.95; }
          100% { transform: translate3d(-145vw, 26vh, 0) rotate(-20deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
        </div>
    );
};

interface ReaderViewProps {
    user: AppUser | null;
    onBack: () => void;
    onAddToCart: (book: Book) => void;
    onLoginRequired: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ user, onAddToCart, onLoginRequired }) => {
    const navigate = useNavigate();
    const { bookId } = useParams<{ bookId: string }>();
    const [manifest, setManifest] = useState<ReaderManifest | null>(null);
    const [pageData, setPageData] = useState<ReaderPageResponse | null>(null);
    const [book, setBook] = useState<Book | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loadingManifest, setLoadingManifest] = useState(true);
    const [loadingPage, setLoadingPage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draftTheme, setDraftTheme] = useState<DraftStudioTheme | null>(null);
    const [showSavedPanel, setShowSavedPanel] = useState(false);
    const [saveToast, setSaveToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [focusMode, setFocusMode] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 767px)').matches;
    });

    const bookTitle = manifest?.title || book?.title || `Book ${bookId}`;
    const { savedPages, isPageSaved, canSaveMore, toggleSavePage, removeSavedPage, clearAllSavedPages, maxSavedPages } =
        useSavedPages(bookId ?? '', bookTitle, user);

    // ── Reading session (sessionStorage — clears when tab closes) ──────────────
    const { lastSessionPage, saveSessionPage } = useReadingSession(bookId ?? '');
    const [initialJumpDone, setInitialJumpDone] = useState(false);
    const [hasManualPageChange, setHasManualPageChange] = useState(false);

    useEffect(() => {
        setInitialJumpDone(false);
        setHasManualPageChange(false);
    }, [bookId, user?.id]);

    // Auto-save the current page to the session on every navigation
    // ONLY after initial jump is complete so we don't accidentally save '1' over our session
    useEffect(() => {
        if (initialJumpDone && bookId && pageNumber >= 1) {
            saveSessionPage(pageNumber);
        }
    }, [initialJumpDone, pageNumber, bookId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Reading position (backend, cross-device) ──────────────────────────────
    const { position: readingPosition, initialised: posInitialised, loading: posLoading, markPage, clearPosition } =
        useReadingPosition(bookId ?? '', user);
    const isMarkedPage = readingPosition?.pageNumber === pageNumber;

    // Auto-resume: session position first (refresh), then pinned position (new session)
    useEffect(() => {
        if (manifest?.status !== 'ready') return;
        if (user && (posLoading || !posInitialised)) return;

        const sessionTarget = lastSessionPage && lastSessionPage > 1 ? lastSessionPage : null;
        const pinnedTarget = readingPosition && readingPosition.pageNumber > 1 ? readingPosition.pageNumber : null;
        const target = sessionTarget ?? pinnedTarget;

        if (!target) {
            if (!initialJumpDone) {
                setInitialJumpDone(true);
            }
            return;
        }

        const canAutoJump = !hasManualPageChange && (pageNumber === 1 || !initialJumpDone);
        if (canAutoJump && pageNumber !== target) {
            setPageNumber(target);
            if (!sessionTarget && pinnedTarget) {
                setSaveToast({ message: `განახლდა დაპინული გვერდიდან ${pinnedTarget}`, type: 'success' });
                setTimeout(() => setSaveToast(null), 2800);
            }
        }

        if (!initialJumpDone) {
            setInitialJumpDone(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manifest?.status, posInitialised, posLoading, user, lastSessionPage, readingPosition, initialJumpDone, hasManualPageChange, pageNumber]);

    const goToRelativePage = (delta: number) => {
        setHasManualPageChange(true);
        setPageNumber((prev) => {
            const maxPage = Math.max(availablePages, 1);
            return Math.min(maxPage, Math.max(1, prev + delta));
        });
    };

    const goToPage = (nextPage: number) => {
        setHasManualPageChange(true);
        const maxPage = Math.max(availablePages, 1);
        setPageNumber(Math.min(maxPage, Math.max(1, nextPage)));
    };

    const normalizeAlignmentFromLegacyCast = (rawHtml: string): string => {
        if (typeof window === 'undefined' || !rawHtml) {
            return rawHtml;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div id="reader-root">${rawHtml}</div>`, 'text/html');
        const root = doc.getElementById('reader-root');
        if (!root) {
            return rawHtml;
        }

        const blocks = Array.from(root.querySelectorAll<HTMLElement>('[style*="text-align"]'));
        for (const block of blocks) {
            // Keep heading alignment as-is. We only normalize body blocks.
            if (/^H[1-6]$/.test(block.tagName)) {
                continue;
            }

            const styleValue = block.getAttribute('style') || '';
            if (!/text-align\s*:\s*center/i.test(styleValue)) {
                continue;
            }

            const text = (block.textContent || '').replace(/\s+/g, ' ').trim();
            const isLikelyParagraph = text.length > 80 || text.split(' ').length > 14;
            if (!isLikelyParagraph) {
                continue;
            }

            const nextStyle = styleValue.replace(/text-align\s*:\s*center\s*;?/gi, 'text-align:left;');
            block.setAttribute('style', nextStyle);
        }

        return root.innerHTML;
    };

    const availablePages = useMemo(() => {
        if (!manifest) return 0;
        if (manifest.access_mode === 'full') return manifest.total_pages;
        return Math.min(3, manifest.total_pages);
    }, [manifest]);

    const pageFrame = useMemo(() => {
        const defaultWidth = 595;
        const defaultHeight = 842;
        const rawWidth = Number(manifest?.page_frame_width);
        const rawHeight = Number(manifest?.page_frame_height);

        const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : defaultWidth;
        const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : defaultHeight;

        return { width, height };
    }, [manifest?.page_frame_width, manifest?.page_frame_height]);

    const pageCanvasStyle = useMemo(
        () =>
            ({
                '--reader-page-ratio-width': String(pageFrame.width),
                '--reader-page-ratio-height': String(pageFrame.height),
                ...(focusMode ? { '--reader-page-max-height': '95vh' } : {})
            }) as React.CSSProperties,
        [pageFrame.height, pageFrame.width, focusMode],
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

        syncViewport();
        mediaQuery.addEventListener('change', syncViewport);

        return () => {
            mediaQuery.removeEventListener('change', syncViewport);
        };
    }, []);

    // Compute Draft Studio applied styles
    const themeFont = useMemo(() => draftTheme ? getFontById(draftTheme.font_id) : null, [draftTheme]);
    const themePalette = useMemo(() => draftTheme ? getPaletteById(draftTheme.palette_id) : null, [draftTheme]);
    const themeAnimation = useMemo(() => draftTheme ? getAnimationById(draftTheme.animation_id) : null, [draftTheme]);
    const themePaper = useMemo(() => draftTheme ? getPaperById(draftTheme.paper_id) : null, [draftTheme]);
    const themeBackground = useMemo(() => draftTheme ? getBackgroundById(draftTheme.background_id) : null, [draftTheme]);
    const effectiveBaseFontSize = useMemo(() => {
        if (!draftTheme) return null;
        const mobileScale = 0.88;
        return isMobileViewport
            ? Math.max(12, draftTheme.base_font_size * mobileScale)
            : draftTheme.base_font_size;
    }, [draftTheme, isMobileViewport]);

    const pageContentStyle = useMemo<React.CSSProperties>(() => {
        if (!draftTheme || !themeFont || !themePalette || !effectiveBaseFontSize) return {};
        return {
            fontFamily: themeFont.family,
            fontSize: `${effectiveBaseFontSize}px`,
            lineHeight: String(draftTheme.line_height),
            letterSpacing: `${draftTheme.letter_spacing}em`,
            color: themePalette.text,
            maxWidth: `${draftTheme.content_width}px`,
            margin: '0 auto',
        };
    }, [draftTheme, effectiveBaseFontSize, themeFont, themePalette]);

    const pageCanvasBgStyle = useMemo<React.CSSProperties>(() => {
        if (!themePalette) return {};
        return {
            backgroundColor: themePalette.page,
        };
    }, [themePalette]);

    useEffect(() => {
        if (!bookId) return;

        let cancelled = false;
        let intervalId: number | null = null;

        const loadManifest = async () => {
            setLoadingManifest(true);
            setError(null);
            try {
                const data = await api.getReaderManifest(bookId);
                if (cancelled) return;
                setManifest(data);

                if (data.status === 'processing') {
                    intervalId = window.setInterval(async () => {
                        try {
                            const polled = await api.getReaderManifest(bookId);
                            if (cancelled) return;
                            setManifest(polled);
                            if (polled.status !== 'processing' && intervalId) {
                                window.clearInterval(intervalId);
                                intervalId = null;
                            }
                        } catch {
                            // Keep polling quietly for transient errors
                        }
                    }, 2500);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'მკითხველის მონაცემების ჩატვირთვა ვერ მოხერხდა');
            } finally {
                if (!cancelled) setLoadingManifest(false);
            }
        };

        loadManifest();

        return () => {
            cancelled = true;
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [bookId]);

    useEffect(() => {
        if (!bookId) return;
        let cancelled = false;

        const loadBook = async () => {
            try {
                const data = await api.getBook(bookId);
                if (!cancelled) setBook(data);
            } catch {
                // Reader still works from manifest/page APIs without this.
            }
        };
        loadBook();

        return () => {
            cancelled = true;
        };
    }, [bookId]);

    // Load Draft Studio theme
    useEffect(() => {
        if (!bookId) return;
        let cancelled = false;
        async function loadDraftTheme() {
            try {
                const data = await api.getBookTheme(bookId!);
                if (cancelled || !data) return;
                setDraftTheme({
                    font_id: (data.font_id as string) || 'bpg-mtavruli',
                    palette_id: (data.palette_id as string) || 'paper-ivory',
                    animation_id: (data.animation_id as string) || 'none',
                    paper_id: (data.paper_id as string) || 'clean',
                    background_id: (data.background_id as string) ||
                        (data.paper_background !== 'white' ? data.paper_background as string : null) ||
                        ((data.css_variables as any)?.background_id) || 'none',
                    base_font_size: (data.base_font_size as number) || 17,
                    line_height: (data.line_height as number) || 1.75,
                    letter_spacing: (data.letter_spacing as number) || 0.01,
                    content_width: (data.content_width as number) || 740,
                });
            } catch {
                // Theme is optional, use defaults
            }
        }
        loadDraftTheme();
        return () => { cancelled = true; };
    }, [bookId]);

    useEffect(() => {
        if (!bookId || !manifest || manifest.status !== 'ready') return;
        if (availablePages > 0 && pageNumber > availablePages) {
            setPageNumber(availablePages);
            return;
        }

        let cancelled = false;
        const loadPage = async () => {
            setLoadingPage(true);
            setError(null);
            try {
                // Fetch page and enforce a minimum 400ms loading duration for visual smoothness (skeleton visible)
                const [data] = await Promise.all([
                    api.getReaderPage(bookId, pageNumber),
                    new Promise(r => setTimeout(r, 400))
                ]);
                if (!cancelled) setPageData(data);
            } catch (err: unknown) {
                if (!cancelled) {
                    setPageData(null);
                    setError(err instanceof Error ? err.message : 'გვერდის ჩატვირთვა ვერ მოხერხდა');
                }
            } finally {
                if (!cancelled) setLoadingPage(false);
            }
        };

        loadPage();
        return () => {
            cancelled = true;
        };
    }, [bookId, manifest, pageNumber, availablePages]);

    const showSaveToast = (message: string, type: 'success' | 'error') => {
        setSaveToast({ message, type });
        setTimeout(() => setSaveToast(null), 2800);
    };

    const handleToggleSave = async () => {
        if (!user) {
            onLoginRequired();
            return;
        }
        const wasSaved = isPageSaved(pageNumber);
        const result = await toggleSavePage(pageNumber);
        if (!result.success && result.reason) {
            showSaveToast(result.reason, 'error');
        } else if (result.success) {
            showSaveToast(wasSaved ? 'გვერდი წაიშალა შენახულიდან' : 'გვერდი შენახულია!', 'success');
        }
    };

    const desktopNavButtonClass = 'reader-desktop-nav-button hidden md:flex items-center justify-center rounded-full border border-white/10 bg-black/45 text-white shadow-[0_14px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#FFFF2E]/80 hover:bg-black hover:text-[#FFFF2E] hover:shadow-[0_0_30px_rgba(255,255,46,0.18)] focus:outline-none disabled:pointer-events-none disabled:opacity-20';
    const desktopActionButtonBaseClass = 'reader-desktop-action-button inline-flex items-center justify-center gap-3 rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-300';


    if (loadingManifest) {
        return (
            <div
                className={`min-h-screen text-white pt-28 pb-20 px-6 flex items-center justify-center ${themePalette ? '' : 'bg-black'}`}
                style={themePalette ? { backgroundColor: themePalette.shell } : undefined}
            >
                <Loader2 className="w-10 h-10 animate-spin text-[#FFFF2E]" />
            </div>
        );
    }

    return (
        <div
            className={`reader-root min-h-screen text-white pt-3 md:pt-8 pb-6 md:pb-12 px-2 sm:px-3 md:px-8 selection:bg-[#FFFF2E] selection:text-black ${focusMode ? 'reader-root--focus' : ''} ${!themePalette ? 'bg-[#0a0a0a]' : ''}`}
            style={{
                position: 'relative',
                ...(themePalette ? { backgroundColor: themePalette.shell } : {}),
                ...(themeBackground?.url ? {
                    backgroundImage: `url(${themeBackground.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                } : {}),
            }}
        >
            {/* Background Dimmer */}
            {themeBackground?.url && (
                <div className="absolute inset-0 bg-black/60 z-[5]" pointer-events-none="true" />
            )}

            {/* Full-screen Animation Overlay */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                {themeAnimation && themeAnimation.effect !== 'none' && (
                    <ReaderAnimationOverlay effect={themeAnimation.effect} accent={themePalette?.accent || '#a46e2a'} />
                )}
            </div>

            {/* ── Toast Notification ── */}
            {saveToast && (
                <div
                    style={{ zIndex: 9999 }}
                    className={`fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] pointer-events-none ${saveToast.type === 'success'
                        ? 'bg-[#FFFF2E] text-black border-2 border-black shadow-[0_4px_20px_rgba(255,255,46,0.3)]'
                        : 'bg-black text-[#FFFF2E] border-2 border-[#FFFF2E] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                        }`}
                >
                    {saveToast.type === 'success' ? (
                        <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                        <X className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {saveToast.message}
                </div>
            )}

            {/* ── Saved Pages Modal — Premium Glassmorphism ── */}
            {showSavedPanel && (
                <div
                    style={{ zIndex: 200 }}
                    className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity"
                    onClick={() => setShowSavedPanel(false)}
                >
                    {/* Modal Core */}
                    <div
                        className="relative w-full max-w-md max-h-[80vh] flex flex-col bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden m-auto ring-1 ring-white/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
                            <h2 className="text-white text-sm sm:text-base font-bold tracking-widest uppercase flex items-center gap-3">
                                <Bookmark className="w-5 h-5 text-[#FFFF2E]" />
                                შენახული გვერდები
                            </h2>
                            <button
                                onClick={() => setShowSavedPanel(false)}
                                className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── List ── */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            {savedPages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                        <Bookmark className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-300 tracking-wide mb-1">გვერდები ჯერ არ არის შენახული</p>
                                                    <p className="text-xs text-gray-500 max-w-[200px]">დააპინეთ გვერდები კითხვისას, რომ მოგვიანებით ადვილად იპოვოთ.</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {savedPages.map((sp, idx) => (
                                        <li
                                            key={sp.pageNumber}
                                            className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                        >
                                            <button
                                                onClick={() => {
                                                    goToPage(sp.pageNumber);
                                                    setShowSavedPanel(false);
                                                }}
                                                className="flex-1 flex items-center gap-4 text-left"
                                            >
                                                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 group-hover:border-[#FFFF2E]/50 group-hover:shadow-[0_0_15px_rgba(255,255,46,0.15)] text-[#FFFF2E] flex items-center justify-center text-lg font-black transition-all">
                                                    {sp.pageNumber}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate">შენახული სლოტი {idx + 1}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1 truncate">
                                                        {new Date(sp.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => removeSavedPage(sp.pageNumber)}
                                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500/80 rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                                                title="სლოტის წაშლა"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        {savedPages.length > 0 && (
                            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                                <button
                                    onClick={clearAllSavedPages}
                                    className="w-full py-3 text-xs font-bold tracking-[0.15em] uppercase text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                >
                                    ყველა გვერდის გასუფთავება
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={`container mx-auto w-full relative z-10 transition-all duration-500 ${focusMode ? 'max-w-[100vw] mt-2 md:mt-0' : 'max-w-6xl mt-0'}`}>
                {/* ── Top Header Bar (Hidden in Focus Mode) ── */}
                <div className={`relative mb-4 md:mb-6 flex-wrap items-center justify-between gap-2 md:gap-4 border-b border-white/15 pb-3 md:pb-4 ${focusMode ? 'hidden' : 'flex'}`}>
                    <button
                        onClick={() => navigate(`/book/${bookId}`)}
                        className="group relative inline-flex items-center justify-center gap-2 bg-red-500 px-4 py-2 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-500 hover:border-red-600"
                    >
                        <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden md:inline">გასვლა</span>
                    </button>

                    <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none hidden md:block w-3/4 max-w-lg">
                        <h1 className="truncate text-base md:text-lg font-black uppercase tracking-[0.06em] text-white">
                            {bookTitle}
                        </h1>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500 truncate">
                            {manifest?.author || book?.author || 'მკითხველი'}
                                                        </p>
                                                    </div>
                                                    {/* fallback for mobile so we have inline flex behavior */}
                                                    <div className="min-w-0 flex-1 text-center md:hidden pointer-events-none px-2">
                                                        <h1 className="truncate text-base font-black uppercase tracking-[0.06em] text-white">
                                                            {bookTitle}
                                                        </h1>
                                                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500 truncate">
                                                            {manifest?.author || book?.author || 'მკითხველი'}
                        </p>
                    </div>

                    {/* ── Saved Pages header button ── */}
                    <div className="flex items-center gap-2">
                        {manifest?.access_mode !== 'preview' && (
                            <button
                                id="reader-open-saved-panel"
                                onClick={() => setShowSavedPanel(true)}
                                title="შენახული გვერდების ნახვა"
                                className={`group relative inline-flex items-center gap-2 px-3 py-2 text-[11px] md:text-[10px] font-black uppercase tracking-[0.18em] transition-all ${savedPages.length > 0
                                    ? 'border-2 border-[#FFFF2E] text-[#FFFF2E] bg-[#FFFF2E]/5'
                                    : 'border border-white/20 text-gray-400 hover:border-[#FFFF2E] hover:text-[#FFFF2E]'
                                    }`}
                            >
                                {savedPages.length > 0
                                    ? <BookmarkCheck className="w-4 h-4" />
                                    : <Bookmark className="w-4 h-4" />}
                                <span className="hidden sm:inline">შენახული</span>
                                {savedPages.length > 0 && (
                                    <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center bg-[#FFFF2E] text-[8px] font-black text-black">
                                        {savedPages.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* ── Top-right Buy Full Access Button ── */}
                        {manifest?.status === 'ready' && manifest.access_mode === 'preview' && book && (
                            <button
                                onClick={() => (user ? onAddToCart(book) : onLoginRequired())}
                                className="group relative inline-flex items-center justify-center gap-2 bg-[#FFFF2E] px-4 py-2 text-black text-[11px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,46,0.5)] border border-[#FFFF2E] hover:border-white reader-buy-btn"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                <span className="relative z-10 hidden md:inline">{user ? 'სრული წვდომის ყიდვა' : 'შესვლა საყიდლად'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {manifest?.status === 'processing' && (
                    <div className="border-2 border-white/20 bg-zinc-950 p-8 flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em]">
                        <Loader2 className="w-5 h-5 animate-spin text-[#FFFF2E]" />
                        დამუშავება მიმდინარეობს. მკითხველის კონტენტი მზადდება.
                    </div>
                )}



                {error && (
                    <div className="mb-6 border-2 border-red-500/40 bg-red-500/10 p-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                        {error}
                    </div>
                )}

                {manifest?.status === 'ready' && (
                    <>

                        <div className={`reader-reading-stage relative group/nav transition-all duration-500 ${focusMode ? 'reader-reading-stage--focus flex-1 flex justify-center w-full px-1 md:px-2' : ''}`}>

                            {/* ── Floating Sidebar Navigation (Focus Mode) ── */}
                            {focusMode && (
                                    <div className="reader-focus-nav fixed bottom-3 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-auto md:right-8 md:top-1/2 md:-translate-y-1/2 z-[60] flex flex-row md:flex-col items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 p-2 md:p-3 rounded-[3rem] shadow-[0_0_40px_rgba(0,0,0,0.7)] transition-opacity duration-300">
                                    <button
                                        onClick={() => setFocusMode(false)}
                                        title="ფოკუს რეჟიმიდან გასვლა"
                                        className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-[#FFFF2E] hover:text-black hover:shadow-[0_0_15px_rgba(255,255,46,0.3)] transition-all order-4 md:order-none"
                                    >
                                        <Minimize className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>

                                    <div className="hidden md:block w-8 h-[1px] bg-white/10 my-1" />

                                    <button
                                        onClick={() => goToRelativePage(-1)}
                                        disabled={pageNumber <= 1}
                                        title="წინა გვერდი"
                                        className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-transparent border border-transparent text-white hover:border-[#FFFF2E] hover:bg-black hover:text-[#FFFF2E] hover:shadow-[0_0_20px_rgba(255,255,46,0.3)] transition-all focus:outline-none disabled:opacity-20 disabled:pointer-events-none order-1 md:order-none"
                                    >
                                        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 ml-[-2px]" />
                                    </button>

                                    <div className="reader-page-counter text-[11px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 my-0 md:my-2 order-2 md:order-none">
                                        {pageNumber} / {Math.max(availablePages, 1)}
                                    </div>

                                    <button
                                        onClick={() => goToRelativePage(1)}
                                        disabled={pageNumber >= Math.max(availablePages, 1)}
                                        title="შემდეგი გვერდი"
                                        className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-transparent border border-transparent text-white hover:border-[#FFFF2E] hover:bg-black hover:text-[#FFFF2E] hover:shadow-[0_0_20px_rgba(255,255,46,0.3)] transition-all focus:outline-none disabled:opacity-20 disabled:pointer-events-none order-3 md:order-none"
                                    >
                                        <ChevronRight className="h-6 w-6 md:h-8 md:w-8 mr-[-2px]" />
                                    </button>
                                </div>
                            )}

                            {!focusMode && (
                                <>
                                    <button
                                        id="reader-prev-page-desktop"
                                        onClick={() => goToRelativePage(-1)}
                                        disabled={pageNumber <= 1}
                                        title="წინა გვერდი"
                                        className={`${desktopNavButtonClass} reader-desktop-nav reader-desktop-nav--prev`}
                                    >
                                        <ChevronLeft className="h-8 w-8 ml-[-2px]" />
                                    </button>

                                    <button
                                        id="reader-next-page-desktop"
                                        onClick={() => goToRelativePage(1)}
                                        disabled={pageNumber >= Math.max(availablePages, 1)}
                                        title="შემდეგი გვერდი"
                                        className={`${desktopNavButtonClass} reader-desktop-nav reader-desktop-nav--next`}
                                    >
                                        <ChevronRight className="h-8 w-8 mr-[-2px]" />
                                    </button>

                                    <div className="reader-desktop-rail hidden md:flex">
                                        <div className="reader-desktop-rail-card">
                                            <div className="reader-desktop-page-meter">
                                                <span className="reader-desktop-page-meter-label">გვერდი</span>
                                                <div className="reader-desktop-page-meter-numbers">
                                                    <strong className="reader-desktop-page-meter-value">{pageNumber}</strong>
                                                    <span className="reader-desktop-page-meter-total">/ {Math.max(availablePages, 1)}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setFocusMode((f) => !f)}
                                                title={focusMode ? 'ფოკუს რეჟიმიდან გასვლა' : 'ფოკუს რეჟიმში შეყვანა'}
                                                className={`${desktopActionButtonBaseClass} border-white/12 bg-white/6 text-white hover:border-[#FFFF2E]/80 hover:bg-[#FFFF2E]/10 hover:text-[#FFFF2E]`}
                                            >
                                                <Maximize className="h-4 w-4" />
                                                <span>ფოკუსი</span>
                                            </button>

                                            {manifest.access_mode !== 'preview' && (
                                                <>
                                                    <button
                                                        id="reader-save-page-btn-desktop"
                                                        onClick={handleToggleSave}
                                                        disabled={!canSaveMore && !isPageSaved(pageNumber)}
                                                        title={isPageSaved(pageNumber) ? 'შენახული გვერდის წაშლა' : canSaveMore ? 'გვერდის შენახვა მოგვიანებლად' : `მაქსიმუმ ${maxSavedPages} გვერდი შენახულია`}
                                                        className={`${desktopActionButtonBaseClass} ${isPageSaved(pageNumber)
                                                            ? 'border-[#FFFF2E] bg-[#FFFF2E] text-black shadow-[0_0_24px_rgba(255,255,46,0.2)]'
                                                            : canSaveMore
                                                                ? 'border-white/12 bg-white/6 text-white hover:border-[#FFFF2E]/80 hover:bg-[#FFFF2E]/10 hover:text-[#FFFF2E]'
                                                                : 'border-white/10 bg-white/[0.03] text-gray-500'
                                                            }`}
                                                    >
                                                        {isPageSaved(pageNumber) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                                                        <span>შენახვა</span>
                                                    </button>

                                                    <button
                                                        id="reader-mark-position-btn-desktop"
                                                        onClick={() => isMarkedPage ? clearPosition() : markPage(pageNumber)}
                                                        title={isMarkedPage ? 'საწყისი პინის წაშლა' : 'ამ გვერდის დაპინება შემდეგ სესიაზე განახლებისთვის'}
                                                        className={`${desktopActionButtonBaseClass} ${isMarkedPage
                                                            ? 'border-[#FFFF2E] bg-[#FFFF2E] text-black shadow-[0_0_24px_rgba(255,255,46,0.2)]'
                                                            : 'border-white/12 bg-white/6 text-white hover:border-[#FFFF2E]/80 hover:bg-[#FFFF2E]/10 hover:text-[#FFFF2E]'
                                                            }`}
                                                    >
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{isMarkedPage ? 'დაპინულია' : 'პინი'}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="reader-page-shell w-full max-w-[100vw] flex justify-center">
                                {/* Wrapper so the ribbon sits outside the overflow:hidden canvas */}
                                <div className="relative w-full flex justify-center h-full">
                                    <div
                                        className={`reader-page-canvas ${focusMode ? 'reader-page-canvas--focus' : ''} ${themePalette ? '' : 'bg-white text-black'} transition-all duration-300`}
                                        style={{ ...pageCanvasStyle, ...pageCanvasBgStyle, position: 'relative', overflow: 'hidden' }}
                                        data-paper-effect={themePaper?.effect || 'clean'}
                                    >
                                        {themePaper && <PaperTextureOverlay effect={themePaper.effect} />}

                                        {loadingPage && (
                                            <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col gap-6" style={{ background: themePalette?.shell ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)' }}>
                                                {/* Skeleton pulsating effect overlaying entire paper */}
                                                <div className="absolute inset-0 z-0 animate-pulse" style={{ backgroundColor: themePalette?.text ? `${themePalette.text}08` : 'rgba(0,0,0,0.02)' }} />

                                                <div className="relative z-10 flex flex-col gap-6 animate-pulse opacity-70">
                                                    {/* Skeleton Header */}
                                                    <div className="h-6 w-[85%] rounded" style={{ backgroundColor: `${themePalette?.text || '#000000'}15` }} />
                                                    <div className="h-4 w-1/2 rounded mb-6" style={{ backgroundColor: `${themePalette?.text || '#000000'}10` }} />

                                                    {/* Skeleton Text Blocks */}
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className="flex flex-col gap-3 mb-2">
                                                            <div className="h-3.5 w-full rounded-sm" style={{ backgroundColor: `${themePalette?.text || '#000000'}10` }} />
                                                            <div className="h-3.5 w-[96%] rounded-sm" style={{ backgroundColor: `${themePalette?.text || '#000000'}10` }} />
                                                            <div className="h-3.5 w-[92%] rounded-sm" style={{ backgroundColor: `${themePalette?.text || '#000000'}10` }} />
                                                            <div className="h-3.5 rounded-sm" style={{ backgroundColor: `${themePalette?.text || '#000000'}10`, width: `${75 - (i % 3) * 12}%` }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!loadingPage && pageData?.render_mode === 'image' && pageData.fallback_image_data && (
                                            <img src={pageData.fallback_image_data} alt={`გვერდი ${pageNumber}`} className="h-full w-full object-contain" />
                                        )}

                                        {!loadingPage && pageData?.render_mode !== 'image' && (
                                            <div className="reader-page-content" style={pageContentStyle}>
                                                {draftTheme && themeFont && themePalette && effectiveBaseFontSize && (
                                                    <style>{`
                          .reader-page-content * {
                            font-family: ${themeFont.family} !important;
                            color: ${themePalette.text} !important;
                            line-height: ${draftTheme.line_height} !important;
                            letter-spacing: ${draftTheme.letter_spacing}em !important;
                          }
                          .reader-page-content p, .reader-page-content span, .reader-page-content div {
                            font-size: ${effectiveBaseFontSize}px !important;
                          }
                          .reader-page-content h1, .reader-page-content h2, .reader-page-content h3 {
                            font-size: ${effectiveBaseFontSize * 1.5}px !important;
                          }
                          .reader-page-content h4, .reader-page-content h5, .reader-page-content h6 {
                            font-size: ${effectiveBaseFontSize * 1.25}px !important;
                          }
                        `}</style>
                                                )}
                                                <article
                                                    className="reader-html"
                                                    style={pageContentStyle}
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeBookHTML(
                                                            normalizeAlignmentFromLegacyCast(pageData?.render_html || '<p></p>')
                                                        ),
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!focusMode && (
                            <div className="reader-mobile-controls mt-4 flex flex-col items-center justify-center gap-3 md:hidden">
                                {/* ── Page counter & Navigation row ── */}
                                <div className="reader-mobile-nav-row flex items-center gap-4 md:gap-8">
                                    <button
                                        id="reader-prev-page"
                                        onClick={() => goToRelativePage(-1)}
                                        disabled={pageNumber <= 1}
                                        title="წინა გვერდი"
                                        className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-110 hover:border-[#FFFF2E] hover:bg-black hover:text-[#FFFF2E] hover:shadow-[0_0_20px_rgba(255,255,46,0.3)] focus:outline-none disabled:pointer-events-none disabled:opacity-20"
                                    >
                                        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 -ml-0.5 md:-ml-1" />
                                    </button>

                                    <div className="reader-page-counter text-xs md:text-xs font-black uppercase tracking-[0.2em] text-gray-300 min-w-[120px] text-center">
                                        გვერდი {pageNumber} / {Math.max(availablePages, 1)}
                                    </div>

                                    <button
                                        id="reader-next-page"
                                        onClick={() => goToRelativePage(1)}
                                        disabled={pageNumber >= Math.max(availablePages, 1)}
                                        title="შემდეგი გვერდი"
                                        className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-110 hover:border-[#FFFF2E] hover:bg-black hover:text-[#FFFF2E] hover:shadow-[0_0_20px_rgba(255,255,46,0.3)] focus:outline-none disabled:pointer-events-none disabled:opacity-20"
                                    >
                                        <ChevronRight className="h-6 w-6 md:h-8 md:w-8 -mr-0.5 md:-mr-1" />
                                    </button>
                                </div>

                                {/* ── Action Row ── */}
                                <div className="reader-mobile-actions flex flex-col items-center gap-3 w-full">

                                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                                        {/* ── Focus Button ── */}
                                        <button
                                            onClick={() => setFocusMode(f => !f)}
                                            title={focusMode ? 'ფოკუს რეჟიმიდან გასვლა' : 'ფოკუს რეჟიმში შეყვანა'}
                                            className={`inline-flex items-center gap-2 px-3.5 py-2 md:px-3 md:py-1.5 text-[10px] md:text-[9px] font-black uppercase tracking-wider transition-colors ${focusMode
                                                ? 'bg-[#FFFF2E] text-black border-[1px] border-[#FFFF2E] shadow-[0_0_10px_rgba(255,255,46,0.3)]'
                                                : 'border border-white/20 text-gray-300 hover:border-[#FFFF2E] hover:text-[#FFFF2E]'
                                                }`}
                                        >
                                            {focusMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                            ფოკუსი
                                        </button>

                                        {manifest.access_mode !== 'preview' && (
                                            <>
                                                {/* Save Button (10 pages) */}
                                                <button
                                                    id="reader-save-page-btn"
                                                    onClick={handleToggleSave}
                                                    disabled={!canSaveMore && !isPageSaved(pageNumber)}
                                                    title={isPageSaved(pageNumber) ? 'შენახული გვერდის წაშლა' : canSaveMore ? 'გვერდის შენახვა მოგვიანებლად' : `მაქსიმუმ ${maxSavedPages} გვერდი შენახულია`}
                                                    className={`inline-flex items-center gap-2 px-3.5 py-2 md:px-3 md:py-1.5 text-[10px] md:text-[9px] font-black uppercase tracking-wider transition-colors ${isPageSaved(pageNumber)
                                                        ? 'bg-[#FFFF2E] text-black border-[1px] border-[#FFFF2E]'
                                                        : canSaveMore
                                                            ? 'border border-white/20 text-gray-300 hover:border-[#FFFF2E] hover:text-[#FFFF2E]'
                                                            : 'border border-white/10 text-gray-600 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {isPageSaved(pageNumber) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                                    შენახვა ({savedPages.length}/{maxSavedPages})
                                                </button>

                                                {/* Pin Button (1 start page) */}
                                                <button
                                                    id="reader-mark-position-btn"
                                                    onClick={() => isMarkedPage ? clearPosition() : markPage(pageNumber)}
                                                    title={isMarkedPage ? 'საწყისი პინის წაშლა' : 'ამ გვერდის დაპინება შემდეგ სესიაზე განახლებისთვის'}
                                                    className={`inline-flex items-center gap-2 px-3.5 py-2 md:px-3 md:py-1.5 text-[10px] md:text-[9px] font-black uppercase tracking-wider transition-colors ${isMarkedPage
                                                        ? 'bg-[#FFFF2E] text-black border-[1px] border-[#FFFF2E] shadow-[0_0_10px_rgba(255,255,46,0.3)]'
                                                        : 'border border-white/20 text-gray-300 hover:border-[#FFFF2E] hover:text-[#FFFF2E]'
                                                        }`}
                                                >
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {isMarkedPage ? 'დაპინული დასაწყისი' : 'დასაწყისის დაპინება'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
