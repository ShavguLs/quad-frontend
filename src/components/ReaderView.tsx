import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, Lock, BookmarkCheck, Bookmark, X, MapPin, Maximize, Minimize } from 'lucide-react';
import { useSavedPages } from '../hooks/useSavedPages';
import { useReadingSession } from '../hooks/useReadingSession';
import { useReadingPosition } from '../hooks/useReadingPosition';
import { api } from '../services/api';
import { getBookPath } from '../lib/seo';
import { sanitizeBookHTML } from '../services/htmlSanitizer';
import type { Book, ReaderManifest, ReaderPageResponse, User as AppUser } from '../types';
import {
    getFontById,
    getPaletteById,
    getAnimationById,
    getBackgroundById,
} from '../constants/draftStudioTheme';
import type { DraftStudioTheme, AnimationEffect } from '../constants/draftStudioTheme';

interface AmbientParticle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}

interface FlareParticle extends AmbientParticle {
    kind: 'flare';
}

interface SnowParticle extends AmbientParticle {
    kind: 'snow';
}

interface SparkleParticle extends AmbientParticle {
    kind: 'sparkle';
    originX: number;
}

interface VortexStarParticle {
    id: string;
    kind: 'star';
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
}

interface VortexNebulaParticle {
    id: string;
    kind: 'nebula';
    x: number;
    y: number;
    size: number;
    opacity: number;
    color: string;
}

interface VortexCometParticle {
    id: string;
    kind: 'comet';
    y: number;
    duration: number;
    delay: number;
    length: number;
}

interface VortexCoreParticle {
    id: 'core';
    kind: 'core';
    x: number;
    y: number;
}

type ReaderOverlayParticle =
    | FlareParticle
    | SnowParticle
    | SparkleParticle
    | VortexStarParticle
    | VortexNebulaParticle
    | VortexCometParticle
    | VortexCoreParticle;

const isNebulaParticle = (particle: ReaderOverlayParticle): particle is VortexNebulaParticle => particle.kind === 'nebula';
const isCoreParticle = (particle: ReaderOverlayParticle): particle is VortexCoreParticle => particle.kind === 'core';
const isStarParticle = (particle: ReaderOverlayParticle): particle is VortexStarParticle => particle.kind === 'star';
const isCometParticle = (particle: ReaderOverlayParticle): particle is VortexCometParticle => particle.kind === 'comet';

/* ── Reader Animation Overlay ── */
const ReaderAnimationOverlay: React.FC<{ effect: AnimationEffect; accent: string }> = ({ effect, accent }) => {
    if (effect === 'none') return null;

    const particles = useMemo<ReaderOverlayParticle[]>(() => {
        if (effect === 'snow') {
            return Array.from({ length: 45 }, (_, i) => {
                const dur = 8 + Math.random() * 10;
                return {
                    kind: 'snow' as const,
                    id: i,
                    x: Math.random() * 100,
                    y: -5,
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
                    kind: 'flare' as const,
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: 30 + Math.random() * 40,
                    delay: -(Math.random() * dur),
                    duration: dur,
                };
            });
        }
        if (effect === 'vortex') {
            const stars = Array.from({ length: 72 }, (_, i) => ({
                id: `star-${i}`,
                kind: 'star' as const,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 0.8 + Math.random() * 2.2,
                opacity: 0.25 + Math.random() * 0.65,
                duration: 2.2 + Math.random() * 3.8,
                delay: -(Math.random() * 4),
            }));

            const nebulae = [
                { id: 'nebula-1', kind: 'nebula' as const, x: 22, y: 24, size: 420, opacity: 0.16, color: '#2f7fff' },
                { id: 'nebula-2', kind: 'nebula' as const, x: 78, y: 70, size: 460, opacity: 0.14, color: '#8c4bff' },
                { id: 'nebula-3', kind: 'nebula' as const, x: 52, y: 48, size: 360, opacity: 0.1, color: '#42d7ff' },
            ];

            const comets = Array.from({ length: 4 }, (_, i) => ({
                id: `comet-${i}`,
                kind: 'comet' as const,
                y: 8 + Math.random() * 55,
                duration: 5 + Math.random() * 4,
                delay: i * 2.8 + Math.random() * 2,
                length: 90 + Math.random() * 50,
            }));

            return [
                ...stars,
                ...nebulae,
                ...comets,
                { id: 'core', kind: 'core' as const, x: 50, y: 50 },
            ];
        }
        if (effect === 'sparkle') {
            return Array.from({ length: 45 }, (_, i) => {
                const dur = 2.5 + Math.random() * 3;
                return {
                    kind: 'sparkle' as const,
                    id: i,
                    x: Math.random() * 100,
                    y: 70 + Math.random() * 40,
                    originX: (Math.random() - 0.5) * 20,
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
            {effect === 'flare' && particles.filter((p): p is FlareParticle => p.kind === 'flare').map((p) => (
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

            {effect === 'snow' && particles.filter((p): p is SnowParticle => p.kind === 'snow').map((p) => (
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

                    {particles.filter(isNebulaParticle).map((p) => (
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

                    {particles.filter(isCoreParticle).map((p) => (
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

                    {particles.filter(isStarParticle).map((p) => (
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

                    {particles.filter(isCometParticle).map((p) => (
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

            {effect === 'sparkle' && particles.filter((p): p is SparkleParticle => p.kind === 'sparkle').map((p) => (
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
                        '--drift': `${p.originX}vw`,
                    } as React.CSSProperties & { '--drift': string }}
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

interface ThemeCssVariables {
    background_id?: string;
}

const getBackgroundIdFromCssVariables = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const cssVars = value as ThemeCssVariables;
    return typeof cssVars.background_id === 'string' && cssVars.background_id.length > 0
        ? cssVars.background_id
        : null;
};

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

    const usingDraftTheme = Boolean(themePalette);
    const rootShellColor = themePalette?.shell || '#fcf9f0';
    const rootTextColor = themePalette?.text || '#1c1c17';
    const warmAccent = '#8d4d36';
    const warmSecondary = '#536441';
    const panelColor = usingDraftTheme ? (themePalette?.page || '#f6f3ea') : '#f6f3ea';
    const panelSoftColor = usingDraftTheme ? (themePalette?.shell || '#fcf9f0') : '#fcf9f0';
    const panelBorderColor = '#c9c6bd';
    const mutedTextColor = usingDraftTheme ? (themePalette?.text || '#474740') : '#474740';
    const pageProgressPercent = useMemo(() => {
        const maxPage = Math.max(availablePages, 1);
        return Math.min(100, Math.max(0, (pageNumber / maxPage) * 100));
    }, [availablePages, pageNumber]);
    const displayTotalPages = Math.max(availablePages, 1);

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
                        getBackgroundIdFromCssVariables(data.css_variables) || 'none',
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

    if (loadingManifest) {
        return (
            <div
                className="min-h-screen pt-28 pb-20 px-6 flex items-center justify-center"
                style={{ backgroundColor: rootShellColor, color: rootTextColor }}
            >
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent }} />
            </div>
        );
    }

    return (
        <div
            className={`reader-root min-h-screen pt-24 md:pt-28 pb-32 md:pb-36 px-3 sm:px-4 md:px-8 selection:text-black ${focusMode ? 'reader-root--focus' : ''} ${usingDraftTheme ? 'reader-root--themed' : 'reader-root--default'}`}
            style={{
                position: 'relative',
                backgroundColor: rootShellColor,
                color: rootTextColor,
                '--reader-page-progress': `${pageProgressPercent}%`,
                ...(themeBackground?.url ? {
                    backgroundImage: `url(${themeBackground.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                } : {}),
            } as React.CSSProperties & { '--reader-page-progress': string }}
        >
            {/* Background Dimmer */}
            {themeBackground?.url && (
                <div className="absolute inset-0 bg-black/60 z-[5] pointer-events-none" />
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
                    style={{
                        zIndex: 9999,
                        borderColor: panelBorderColor,
                        backgroundColor: saveToast.type === 'success'
                            ? panelColor
                            : panelSoftColor,
                        color: saveToast.type === 'success'
                            ? (usingDraftTheme ? (themePalette?.text || '#1c1c17') : '#1c1c17')
                            : (usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent),
                    }}
                    className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] pointer-events-none border shadow-[0_10px_24px_rgba(28,28,23,0.15)]"
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
                    className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-[rgba(28,28,23,0.28)] backdrop-blur-sm transition-opacity"
                    onClick={() => setShowSavedPanel(false)}
                >
                    {/* Modal Core */}
                    <div
                        className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl overflow-hidden m-auto"
                        style={{
                            backgroundColor: panelColor,
                            border: `1px solid ${panelBorderColor}`,
                            boxShadow: '0 28px 60px -30px rgba(28,28,23,0.35)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: panelBorderColor }}>
                            <h2 className="text-sm sm:text-base font-bold tracking-widest uppercase flex items-center gap-3" style={{ color: usingDraftTheme ? (themePalette?.text || '#1c1c17') : '#1c1c17' }}>
                                <Bookmark className="w-5 h-5" style={{ color: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent }} />
                                შენახული გვერდები
                            </h2>
                            <button
                                onClick={() => setShowSavedPanel(false)}
                                className="p-2 rounded-full transition-all"
                                style={{ color: mutedTextColor }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── List ── */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            {savedPages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: panelSoftColor, border: `1px solid ${panelBorderColor}` }}>
                                        <Bookmark className="w-8 h-8" style={{ color: mutedTextColor }} />
                                    </div>
                                    <p className="text-sm font-semibold tracking-wide mb-1" style={{ color: usingDraftTheme ? (themePalette?.text || '#1c1c17') : '#1c1c17' }}>გვერდები ჯერ არ არის შენახული</p>
                                    <p className="text-xs max-w-[200px]" style={{ color: mutedTextColor }}>დააპინეთ გვერდები კითხვისას, რომ მოგვიანებით ადვილად იპოვოთ.</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {savedPages.map((sp, idx) => (
                                        <li
                                            key={sp.pageNumber}
                                            className="group flex items-center justify-between p-3 rounded-xl border transition-all"
                                            style={{ borderColor: 'transparent' }}
                                        >
                                            <button
                                                onClick={() => {
                                                    goToPage(sp.pageNumber);
                                                    setShowSavedPanel(false);
                                                }}
                                                className="flex-1 flex items-center gap-4 text-left"
                                            >
                                                <div className="w-12 h-12 flex-shrink-0 rounded-xl border flex items-center justify-center text-lg font-black transition-all" style={{
                                                    backgroundColor: usingDraftTheme ? (themePalette?.shell || '#fcf9f0') : '#fcf9f0',
                                                    borderColor: panelBorderColor,
                                                    color: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent,
                                                }}>
                                                    {sp.pageNumber}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-semibold transition-colors truncate" style={{ color: usingDraftTheme ? (themePalette?.text || '#1c1c17') : '#1c1c17' }}>შენახული სლოტი {idx + 1}</span>
                                                    <span className="text-[10px] font-medium uppercase tracking-widest mt-1 truncate" style={{ color: mutedTextColor }}>
                                                        {new Date(sp.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => removeSavedPage(sp.pageNumber)}
                                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                                                style={{ color: mutedTextColor }}
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
                            <div className="p-4 border-t" style={{ borderColor: panelBorderColor }}>
                                <button
                                    onClick={clearAllSavedPages}
                                    className="w-full py-3 text-xs font-bold tracking-[0.15em] uppercase rounded-xl transition-all"
                                    style={{
                                        color: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent,
                                        border: `1px solid ${panelBorderColor}`,
                                        backgroundColor: panelSoftColor,
                                    }}
                                >
                                    ყველა გვერდის გასუფთავება
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <header
                className={`reader-top-header fixed top-0 left-0 right-0 z-[70] px-3 sm:px-4 md:px-8 py-3 md:py-4 ${focusMode ? 'reader-top-header--focus' : ''}`}
                style={{
                    backgroundColor: usingDraftTheme ? 'rgba(0,0,0,0.58)' : 'rgba(252,249,240,0.86)',
                    color: usingDraftTheme ? (themePalette?.text || '#f5f5f0') : '#596060',
                    borderBottom: `1px solid ${usingDraftTheme ? 'rgba(255,255,255,0.12)' : 'rgba(201,198,189,0.75)'}`,
                    backdropFilter: 'blur(14px)',
                }}
            >
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 md:gap-6">
                    <button
                        onClick={() => navigate(getBookPath(book ?? { id: bookId ?? '' }), { state: book ? { book } : undefined })}
                        className="reader-header-back inline-flex items-center gap-1.5 md:gap-2 rounded-full px-2.5 py-2 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-75"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span>გასვლა</span>
                    </button>

                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center max-w-[62vw] md:max-w-[50vw]">
                        <h1
                            className="truncate text-base md:text-lg font-bold tracking-tight"
                            style={{ fontFamily: usingDraftTheme ? undefined : 'Newsreader, Georgia, serif', color: usingDraftTheme ? (themePalette?.text || '#f5f5f0') : '#1c1c17' }}
                        >
                            {bookTitle}
                        </h1>
                        <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.24em]" style={{ color: usingDraftTheme ? 'rgba(255,255,255,0.66)' : '#78776f' }}>
                            {manifest?.author || book?.author || 'მკითხველი'}
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5 md:gap-2">
                        {manifest?.access_mode !== 'preview' && (
                            <button
                                id="reader-open-saved-panel"
                                onClick={() => setShowSavedPanel(true)}
                                title="შენახული გვერდების ნახვა"
                                className="reader-header-action inline-flex h-9 w-9 items-center justify-center rounded-full border"
                                style={{
                                    borderColor: usingDraftTheme ? 'rgba(255,255,255,0.2)' : panelBorderColor,
                                    backgroundColor: usingDraftTheme ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)',
                                    color: savedPages.length > 0 ? (usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent) : mutedTextColor,
                                }}
                            >
                                {savedPages.length > 0 ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                            </button>
                        )}

                        {manifest?.access_mode === 'preview' && book && (
                            <button
                                onClick={() => (user ? onAddToCart(book) : onLoginRequired())}
                                className="hidden md:inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                                style={{
                                    borderColor: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent,
                                    backgroundColor: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent,
                                    color: '#fff',
                                }}
                            >
                                <Lock className="h-3.5 w-3.5" />
                                {user ? 'სრული წვდომა' : 'შესვლა'}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className={`container mx-auto w-full relative z-10 transition-all duration-500 ${focusMode ? 'max-w-[100vw]' : 'max-w-6xl'}`}>

                {manifest?.status === 'processing' && (
                    <div className="border p-8 flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em]" style={{ borderColor: panelBorderColor, backgroundColor: panelColor, color: usingDraftTheme ? (themePalette?.text || '#1c1c17') : '#1c1c17' }}>
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent }} />
                        დამუშავება მიმდინარეობს. მკითხველის კონტენტი მზადდება.
                    </div>
                )}



                {error && (
                    <div className="mb-6 border p-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderColor: warmAccent, color: warmAccent, backgroundColor: panelSoftColor }}>
                        {error}
                    </div>
                )}

                {manifest?.status === 'ready' && (
                    <>

                        <div className={`reader-reading-stage relative transition-all duration-500 ${focusMode ? 'reader-reading-stage--focus flex-1 flex justify-center w-full px-1 md:px-2' : ''}`}>

                            <div className="reader-progress-track mx-auto mb-3 h-[2px] w-full max-w-[595px] overflow-hidden rounded-full" style={{ backgroundColor: usingDraftTheme ? 'rgba(255,255,255,0.2)' : '#e5e2da' }}>
                                <div
                                    className="reader-progress-fill h-full transition-all duration-500"
                                    style={{
                                        width: `${pageProgressPercent}%`,
                                        backgroundColor: usingDraftTheme ? (themePalette?.accent || warmSecondary) : warmSecondary,
                                    }}
                                />
                            </div>

                            {/* ── Floating Sidebar Navigation (Focus Mode) ── */}
                            {focusMode && (
                                <div
                                    className="reader-focus-nav fixed bottom-3 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-auto md:right-8 md:top-1/2 md:-translate-y-1/2 z-[60] flex flex-row md:flex-col items-center gap-2 p-2 md:p-3 rounded-[2rem] transition-opacity duration-300"
                                    style={{
                                        backgroundColor: usingDraftTheme ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.88)',
                                        border: `1px solid ${usingDraftTheme ? 'rgba(255,255,255,0.16)' : panelBorderColor}`,
                                        boxShadow: usingDraftTheme ? '0 0 40px rgba(0,0,0,0.7)' : '0 18px 40px -24px rgba(28,28,23,0.35)',
                                        color: usingDraftTheme ? (themePalette?.text || '#f5f5f0') : '#1c1c17',
                                    }}
                                >
                                    <button
                                        onClick={() => setFocusMode(false)}
                                        title="ფოკუს რეჟიმიდან გასვლა"
                                        className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full transition-all order-4 md:order-none"
                                        style={{
                                            backgroundColor: usingDraftTheme ? 'rgba(255,255,255,0.08)' : panelSoftColor,
                                            color: usingDraftTheme ? 'rgba(255,255,255,0.7)' : mutedTextColor,
                                        }}
                                    >
                                        <Minimize className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>

                                    <div className="hidden md:block w-8 h-[1px] my-1" style={{ backgroundColor: usingDraftTheme ? 'rgba(255,255,255,0.12)' : panelBorderColor }} />

                                    <button
                                        onClick={() => goToRelativePage(-1)}
                                        disabled={pageNumber <= 1}
                                        title="წინა გვერდი"
                                        className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full border transition-all focus:outline-none disabled:opacity-20 disabled:pointer-events-none order-1 md:order-none"
                                        style={{
                                            borderColor: 'transparent',
                                            color: usingDraftTheme ? (themePalette?.text || '#f5f5f0') : '#1c1c17',
                                            backgroundColor: 'transparent',
                                        }}
                                    >
                                        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 ml-[-2px]" />
                                    </button>

                                        <div className="reader-page-counter text-[10px] md:text-[10px] font-semibold uppercase tracking-[0.18em] my-0 md:my-2 order-2 md:order-none" style={{ color: usingDraftTheme ? 'rgba(255,255,255,0.72)' : mutedTextColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        {pageNumber} / {displayTotalPages}
                                    </div>

                                    <button
                                        onClick={() => goToRelativePage(1)}
                                        disabled={pageNumber >= Math.max(availablePages, 1)}
                                        title="შემდეგი გვერდი"
                                        className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full border transition-all focus:outline-none disabled:opacity-20 disabled:pointer-events-none order-3 md:order-none"
                                        style={{
                                            borderColor: 'transparent',
                                            color: usingDraftTheme ? (themePalette?.text || '#f5f5f0') : '#1c1c17',
                                            backgroundColor: 'transparent',
                                        }}
                                    >
                                        <ChevronRight className="h-6 w-6 md:h-8 md:w-8 mr-[-2px]" />
                                    </button>
                                </div>
                            )}

                            <div className="reader-page-shell w-full max-w-[100vw] flex justify-center">
                                <div className="relative w-full flex justify-center h-full">
                                    <div
                                        className={`reader-page-canvas ${focusMode ? 'reader-page-canvas--focus' : ''} ${themePalette ? '' : 'bg-white text-black'} transition-all duration-300`}
                                        style={{ ...pageCanvasStyle, ...pageCanvasBgStyle, position: 'relative', overflow: 'hidden' }}
                                        data-paper-effect="clean"
                                    >
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
                                                <div className="reader-chapter-heading">
                                                    <h2 className="reader-chapter-title" style={{ color: usingDraftTheme ? (themePalette?.text || '#1c1c17') : '#474740' }}>
                                                        თავი {pageNumber}
                                                    </h2>
                                                    <p className="reader-chapter-subtitle" style={{ color: usingDraftTheme ? 'rgba(255,255,255,0.66)' : '#78776f' }}>
                                                        {manifest?.author || book?.author || 'ამბავი'}
                                                    </p>
                                                </div>
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
                            <nav className="reader-pill-nav fixed left-1/2 bottom-0 z-[65] -translate-x-1/2 flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2">
                                <button
                                    id="reader-prev-page"
                                    onClick={() => goToRelativePage(-1)}
                                    disabled={pageNumber <= 1}
                                    title="წინა გვერდი"
                                    className="reader-pill-btn flex flex-col items-center justify-center rounded-full px-2.5 py-1.5 md:px-3 md:py-2 text-[#596060] disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                                    <span className="reader-pill-label">გვერდი</span>
                                </button>

                                <div className="reader-pill-divider" />

                                <div className="reader-pill-progress px-2 md:px-3 text-center">
                                    <span className="reader-pill-label">პროგრესი</span>
                                    <span className="reader-pill-count">{pageNumber} / {displayTotalPages}</span>
                                </div>

                                <div className="reader-pill-divider" />

                                <button
                                    onClick={() => setFocusMode(true)}
                                    title="ფოკუს რეჟიმში შეყვანა"
                                    className="reader-pill-btn reader-pill-btn--focus flex flex-col items-center justify-center rounded-full px-2.5 py-1.5 md:px-3 md:py-2"
                                >
                                    <Maximize className="h-4 w-4 md:h-5 md:w-5" />
                                    <span className="reader-pill-label">ფოკუსი</span>
                                </button>

                                <button
                                    id="reader-next-page"
                                    onClick={() => goToRelativePage(1)}
                                    disabled={pageNumber >= displayTotalPages}
                                    title="შემდეგი გვერდი"
                                    className="reader-pill-btn flex flex-col items-center justify-center rounded-full px-2.5 py-1.5 md:px-3 md:py-2 text-[#596060] disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                                    <span className="reader-pill-label">შემდეგი</span>
                                </button>

                                {manifest.access_mode !== 'preview' && (
                                    <>
                                        <button
                                            id="reader-save-page-btn"
                                            onClick={handleToggleSave}
                                            disabled={!canSaveMore && !isPageSaved(pageNumber)}
                                            title={isPageSaved(pageNumber) ? 'შენახული გვერდის წაშლა' : canSaveMore ? 'გვერდის შენახვა მოგვიანებლად' : `მაქსიმუმ ${maxSavedPages} გვერდი შენახულია`}
                                            className="reader-pill-icon-btn"
                                            style={{ color: isPageSaved(pageNumber) ? warmAccent : '#596060' }}
                                        >
                                            {isPageSaved(pageNumber) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                                        </button>
                                        <button
                                            id="reader-mark-position-btn"
                                            onClick={() => isMarkedPage ? clearPosition() : markPage(pageNumber)}
                                            title={isMarkedPage ? 'საწყისი პინის წაშლა' : 'ამ გვერდის დაპინება შემდეგ სესიაზე განახლებისთვის'}
                                            className="reader-pill-icon-btn"
                                            style={{ color: isMarkedPage ? warmAccent : '#596060' }}
                                        >
                                            <MapPin className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </nav>
                        )}

                        <button
                            type="button"
                            className="reader-side-trigger"
                            title="შენახული გვერდები"
                            onClick={() => setShowSavedPanel(true)}
                        >
                            <span className="reader-side-trigger__icon">|||</span>
                        </button>

                        {manifest?.access_mode === 'preview' && book && (
                            <div className="mt-6 flex justify-center md:hidden">
                                <button
                                    onClick={() => (user ? onAddToCart(book) : onLoginRequired())}
                                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                                    style={{
                                        borderColor: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent,
                                        backgroundColor: usingDraftTheme ? (themePalette?.accent || warmAccent) : warmAccent,
                                        color: '#fff',
                                    }}
                                >
                                    <Lock className="h-3.5 w-3.5" />
                                    {user ? 'სრული წვდომა' : 'შესვლა'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
