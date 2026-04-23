import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Loader2, Maximize, Minimize, Pin, ShoppingBag, X } from 'lucide-react';
import { useSavedPages } from '../hooks/useSavedPages';
import { useReadingPosition } from '../hooks/useReadingPosition';
import { getBookPath } from '../lib/seo';
import { api } from '../services/api';
import { sanitizeBookHTML } from '../services/htmlSanitizer';
import {
  getAnimationById,
  getBackgroundById,
  getFontById,
  getPaletteById,
} from '../constants/draftStudioTheme';
import type { Book, ReaderManifest, ReaderPageResponse, User as AppUser } from '../types';

interface ReaderViewProps {
  user: AppUser | null;
  onBack: () => void;
  onAddToCart: (book: Book) => void;
  onLoginRequired: () => void;
  isPreview?: boolean;
}

interface DraftTheme {
  font_id: string;
  palette_id: string;
  animation_id: string;
  background_id: string;
  base_font_size: number;
  line_height: number;
  letter_spacing: number;
  content_width: number;
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

export const ReaderView: React.FC<ReaderViewProps> = ({ user, onBack, onAddToCart, onLoginRequired, isPreview: isPreviewProp }) => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const location = useLocation();
  const isPreviewMode = isPreviewProp ?? location.state?.isPreview ?? false;

  const [manifest, setManifest] = useState<ReaderManifest | null>(null);
  const [pageData, setPageData] = useState<ReaderPageResponse | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [draftTheme, setDraftTheme] = useState<DraftTheme | null>(null);
  const [purchaseRequired, setPurchaseRequired] = useState(false);

  const bookTitle = manifest?.title || book?.title || 'წიგნი';
  const {
    savedPages,
    isPageSaved,
    toggleSavePage,
    removeSavedPage,
    clearAllSavedPages,
  } = useSavedPages(bookId ?? '', bookTitle, user);

  const {
    position: readingPosition,
    markPage,
    clearPosition,
  } = useReadingPosition(bookId ?? '', user);

  const isMarkedPage = readingPosition?.pageNumber === pageNumber;

  const availablePages = useMemo(() => {
    if (!manifest) return 0;
    if (isPreviewMode) return Math.min(manifest.total_pages, 10);
    return manifest.total_pages;
  }, [manifest, isPreviewMode]);

  const displayTotalPages = Math.max(availablePages, 1);
  const pageProgressPercent = Math.min(100, Math.max(0, (pageNumber / displayTotalPages) * 100));

  const themeFont = useMemo(() => (draftTheme ? getFontById(draftTheme.font_id) : null), [draftTheme]);
  const themePalette = useMemo(() => (draftTheme ? getPaletteById(draftTheme.palette_id) : null), [draftTheme]);
  const themeBackground = useMemo(() => (draftTheme ? getBackgroundById(draftTheme.background_id) : null), [draftTheme]);
  const themeAnimation = useMemo(() => (draftTheme ? getAnimationById(draftTheme.animation_id) : null), [draftTheme]);

  const shellColor = themePalette?.shell || '#fcf9f0';
  const pageColor = themePalette?.page || '#ffffff';
  const textColor = themePalette?.text || '#1c1c17';
  const accentColor = themePalette?.accent || '#8d4d36';
  const secondaryColor = '#536441';

  const pageContentStyle = useMemo<React.CSSProperties>(() => {
    if (!draftTheme || !themePalette || !themeFont) {
      return {};
    }

    return {
      fontFamily: themeFont.family,
      fontSize: `${draftTheme.base_font_size}px`,
      lineHeight: String(draftTheme.line_height),
      letterSpacing: `${draftTheme.letter_spacing}em`,
      color: themePalette.text,
      maxWidth: `${draftTheme.content_width}px`,
      margin: '0 auto',
    };
  }, [draftTheme, themePalette, themeFont]);

  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;

    const loadManifest = async () => {
      setLoadingManifest(true);
      setError(null);
      setPurchaseRequired(false);
      try {
        const data = await api.getReaderManifest(bookId);
        if (!cancelled) {
          setManifest(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '';
          if (message.includes('Purchase required')) {
            setPurchaseRequired(true);
          } else {
            setError(message || 'მკითხველის ჩატვირთვა ვერ მოხერხდა');
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingManifest(false);
        }
      }
    };

    loadManifest();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;

    const loadBook = async () => {
      try {
        const data = await api.getBook(bookId);
        if (!cancelled) {
          setBook(data);
        }
      } catch {
        // no-op
      }
    };

    loadBook();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;

    const loadDraftTheme = async () => {
      try {
        const data = await api.getBookTheme(bookId);
        if (cancelled) return;
        setDraftTheme({
          font_id: (data.font_id as string) || 'bpg-mtavruli',
          palette_id: (data.palette_id as string) || 'paper-ivory',
          animation_id: (data.animation_id as string) || 'none',
          background_id:
            (data.background_id as string) ||
            (data.paper_background !== 'white' ? (data.paper_background as string) : null) ||
            getBackgroundIdFromCssVariables(data.css_variables) ||
            'none',
          base_font_size: (data.base_font_size as number) || 17,
          line_height: (data.line_height as number) || 1.75,
          letter_spacing: (data.letter_spacing as number) || 0.01,
          content_width: (data.content_width as number) || 740,
        });
      } catch {
        // no-op
      }
    };

    loadDraftTheme();
    return () => {
      cancelled = true;
    };
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
        const data = await api.getReaderPage(bookId, pageNumber);
        if (!cancelled) {
          setPageData(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'გვერდის ჩატვირთვა ვერ მოხერხდა');
        }
      } finally {
        if (!cancelled) {
          setLoadingPage(false);
        }
      }
    };

    loadPage();
    return () => {
      cancelled = true;
    };
  }, [bookId, manifest, pageNumber, availablePages]);

  const goToRelativePage = (delta: number) => {
    setPageNumber((prev) => {
      const maxPage = Math.max(availablePages, 1);
      return Math.min(maxPage, Math.max(1, prev + delta));
    });
  };

  const handleBagClick = () => {
    if (book) {
      if (user) {
        onAddToCart(book);
      } else {
        onLoginRequired();
      }
      return;
    }
    setShowSavedPanel(true);
  };

  if (loadingManifest) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: shellColor, color: textColor }}>
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (manifest?.access_mode === 'expired') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: shellColor, color: textColor }}
      >
        <div className="text-center space-y-6 p-8">
          <h1 className="text-3xl font-bold">წვდომა ამოწურულია</h1>
          <p className="text-lg opacity-70">
            ამ წიგნის წვდოვა ამოიწურა. ხელახლა შეძენისთვის გთხოვთ იხილოთ წიგნის გვერდი.
          </p>
          {book && (
            <button
              className="reader-buy-btn mx-auto"
              onClick={() => {
                if (user) {
                  onAddToCart(book);
                } else {
                  onLoginRequired();
                }
              }}
            >
              ხელახლა შეძენა
            </button>
          )}
          <button className="reader-action mx-auto" onClick={onBack}>
            უკან დაბრუნება
          </button>
        </div>
      </div>
    );
  }

  if (purchaseRequired) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: shellColor, color: textColor }}
      >
        <div className="text-center space-y-6 p-8">
          <h1 className="text-3xl font-bold">ყიდვა საჭიროა</h1>
          <p className="text-lg opacity-70">
            ამ წიგნის წასაკითხად საჭიროა შეძენა.
          </p>
          {book && (
            <button
              className="reader-buy-btn mx-auto"
              onClick={() => {
                if (user) {
                  onAddToCart(book);
                } else {
                  onLoginRequired();
                }
              }}
            >
              ყიდვა — {manifest?.price || book?.price ? `₾${book?.price ?? manifest?.price}` : ''}
            </button>
          )}
          <button className="reader-action mx-auto" onClick={onBack}>
            უკან დაბრუნება
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`reader-root ${focusMode ? 'reader-root--focus' : ''}`}
      style={{
        backgroundColor: shellColor,
        color: textColor,
        ...(themeBackground?.url
          ? {
            backgroundImage: `url(${themeBackground.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
          : {}),
      }}
    >
      {themeBackground?.url && <div className="reader-bg-dimmer" />}

      <header className={`reader-header ${focusMode ? 'reader-header--hidden' : ''}`} style={{ color: themePalette ? themePalette.text : '#596060' }}>
        <div className="reader-header-left">
          <button className="reader-action" onClick={onBack}>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>გასვლა</span>
          </button>
        </div>

        <div className="reader-header-center">
          <h1>{bookTitle}</h1>
          <span>{manifest?.author || book?.author || 'მკითხველი'}</span>
        </div>

        <div className="reader-header-right">
          {!isPreviewMode && (
            <>
              <button className="reader-icon-btn" onClick={handleBagClick}>
                <ShoppingBag className="h-5 w-5" />
                {savedPages.length > 0 && <span className="reader-badge" style={{ backgroundColor: accentColor }}>{savedPages.length}</span>}
              </button>
              <button
                className="reader-icon-btn"
                onClick={() => toggleSavePage(pageNumber)}
                style={{ color: isPageSaved(pageNumber) ? accentColor : '#8d4d36' }}
              >
                <Heart className={isPageSaved(pageNumber) ? 'h-5 w-5 fill-current' : 'h-5 w-5'} />
              </button>
              <button
                className="reader-icon-btn"
                onClick={() => (isMarkedPage ? clearPosition() : markPage(pageNumber))}
                style={{ color: isMarkedPage ? accentColor : '#8d4d36' }}
              >
                <Pin className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="reader-main">
        <div className="reader-canvas-wrap">
          <div className="reader-progress-track">
            <div className="reader-progress-fill" style={{ width: `${pageProgressPercent}%`, backgroundColor: secondaryColor }} />
          </div>

          <div className="paper-canvas" style={{ backgroundColor: pageColor }}>
            <div className="spine-shadow" />
            <div className="reader-paper-texture" />

            {error && <div className="reader-error">{error}</div>}

            {loadingPage && (
              <div className="reader-loading">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            {!loadingPage && pageData?.render_mode === 'image' && pageData.fallback_image_data && (
              <img src={pageData.fallback_image_data} alt={`გვერდი ${pageNumber}`} className="reader-image" />
            )}

            {!loadingPage && pageData?.render_mode !== 'image' && (
              <div className="reader-page-content" style={pageContentStyle}>
                <article
                  className="reader-html"
                  style={pageContentStyle}
                  dangerouslySetInnerHTML={{ __html: sanitizeBookHTML(pageData?.render_html || '<p></p>') }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {!focusMode && (
        <nav className="reader-bottom-nav-wrap">
          <div className="reader-bottom-nav">
            <button
              className="reader-pill-btn"
              onClick={() => goToRelativePage(-1)}
              disabled={pageNumber <= 1}
              id="reader-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>გვერდი</span>
            </button>

            <div className="reader-pill-divider" />

            <div className="reader-progress-pill">
              <span>პროგრესი</span>
              <strong>{pageNumber} / {displayTotalPages}</strong>
            </div>

            <div className="reader-pill-divider" />

            {!isPreviewMode && (
              <button className="reader-pill-btn reader-pill-btn--focus" onClick={() => setFocusMode(true)}>
                <Maximize className="h-4 w-4" />
                <span>ფოკუსი</span>
              </button>
            )}

            <button
              className="reader-pill-btn"
              onClick={() => goToRelativePage(1)}
              disabled={pageNumber >= displayTotalPages}
              id="reader-next-page"
            >
              <ChevronRight className="h-4 w-4" />
              <span>ძებნა</span>
            </button>
          </div>
        </nav>
      )}

      {focusMode && (
        <button className="reader-exit-focus" onClick={() => setFocusMode(false)}>
          <Minimize className="h-4 w-4" />
          <span>გასვლა ფოკუსიდან</span>
        </button>
      )}

      {!isPreviewMode && (
        <button className="reader-side-trigger" onClick={() => setShowSavedPanel(true)}>
          <span>menu_open</span>
        </button>
      )}

      {!isPreviewMode && showSavedPanel && (
        <div className="reader-saved-overlay" onClick={() => setShowSavedPanel(false)}>
          <div className="reader-saved-panel" onClick={(e) => e.stopPropagation()}>
            <div className="reader-saved-header">
              <h3>შენახული გვერდები</h3>
              <button onClick={() => setShowSavedPanel(false)}><X className="h-4 w-4" /></button>
            </div>

            <div className="reader-saved-list">
              {savedPages.length === 0 ? (
                <p>შენახული გვერდები არ გაქვთ</p>
              ) : (
                savedPages.map((entry) => (
                  <div key={entry.pageNumber} className="reader-saved-item">
                    <button
                      onClick={() => {
                        setPageNumber(entry.pageNumber);
                        setShowSavedPanel(false);
                      }}
                    >
                      გვერდი {entry.pageNumber}
                    </button>
                    <button onClick={() => removeSavedPage(entry.pageNumber)}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {savedPages.length > 0 && (
              <button className="reader-clear-btn" onClick={clearAllSavedPages}>ყველას წაშლა</button>
            )}
          </div>
        </div>
      )}

      {themeAnimation && themeAnimation.effect !== 'none' && <div className="reader-overlay-blocker" />}

      <button
        className="reader-hidden-link"
        onClick={() => navigate(getBookPath(book ?? { id: bookId ?? '' }), { state: book ? { book } : undefined })}
        aria-hidden
      />
    </div>
  );
};
