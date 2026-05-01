import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Download, Loader2, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { sanitizeBookHTML } from '../services/htmlSanitizer';
import type { ReaderAccessResponse, ReaderPage } from '../types';

const MAIN_APP_BASE_URL = (import.meta.env.VITE_MAIN_APP_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://quaduni.com';
const PAGE_BATCH_SIZE = 12;
const LazyPDFViewer = React.lazy(() => import('@embedpdf/react-pdf-viewer').then((module) => ({ default: module.PDFViewer })));

interface ReaderErrorBoundaryState {
  error: Error | null;
}

export class ReaderErrorBoundary extends React.Component<{ children: React.ReactNode }, ReaderErrorBoundaryState> {
  state: ReaderErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ReaderErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Reader failed to render', error);
  }

  render() {
    if (this.state.error) {
      return (
        <ReaderFailure
          title="მკითხველი ვერ ჩაიტვირთა"
          message="სცადეთ გვერდის განახლება ან წიგნის გვერდზე დაბრუნება."
        />
      );
    }

    return this.props.children;
  }
}

const resolveBookId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const [bookId] = window.location.pathname.replace(/^\/+/, '').split('/');
  return bookId || null;
};

export const ReaderSubdomainApp: React.FC = () => {
  const bookId = useMemo(resolveBookId, []);
  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
  const [access, setAccess] = useState<ReaderAccessResponse | null>(null);
  const [pages, setPages] = useState<Record<number, ReaderPage>>({});
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);
  const [showPdfFallback, setShowPdfFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pagesRef = useRef<Record<number, ReaderPage>>({});
  const totalPagesRef = useRef<number | null>(null);
  const pendingPagesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

  useEffect(() => {
    if (!bookId) {
      setError('წიგნი ვერ მოიძებნა.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getReaderAccess(bookId, preview)
      .then((payload) => {
        if (!cancelled) setAccess(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'მკითხველი დროებით მიუწვდომელია.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, preview]);

  const loadPageRange = useCallback(async (startPage: number, endPage: number) => {
    if (!bookId || !access?.can_read) return;

    const knownTotal = totalPagesRef.current ?? access.total_pages ?? (preview ? access.preview_pages : null);
    const start = Math.max(1, Math.floor(startPage));
    const end = Math.max(start, Math.floor(knownTotal ? Math.min(endPage, knownTotal) : endPage));
    const missing = Array.from({ length: end - start + 1 }, (_, index) => start + index)
      .filter((pageNumber) => !pagesRef.current[pageNumber] && !pendingPagesRef.current.has(pageNumber));
    if (missing.length === 0) return;

    const requestStart = Math.min(...missing);
    const requestEnd = Math.max(...missing);
    missing.forEach((pageNumber) => pendingPagesRef.current.add(pageNumber));

    setLoadingPages(true);
    try {
      const payload = await api.getReaderPages(bookId, {
        start: requestStart,
        end: requestEnd,
        preview,
      });
      if (payload.pages.length === 0) {
        throw new Error('გვერდები ჯერ არ არის მომზადებული.');
      }
      totalPagesRef.current = payload.total_pages;
      setTotalPages(payload.total_pages);
      setPages((current) => {
        const next = { ...current };
        for (const page of payload.pages) {
          next[page.page_number] = page;
        }
        pagesRef.current = next;
        return next;
      });
      setPagesError(null);
    } catch (err: unknown) {
      setPagesError(err instanceof Error ? err.message : 'გვერდები ვერ ჩაიტვირთა.');
    } finally {
      missing.forEach((pageNumber) => pendingPagesRef.current.delete(pageNumber));
      setLoadingPages(false);
    }
  }, [access, bookId, preview]);

  useEffect(() => {
    setPages({});
    setTotalPages(null);
    setPagesError(null);
    setShowPdfFallback(false);
    pagesRef.current = {};
    totalPagesRef.current = null;
    pendingPagesRef.current.clear();
  }, [bookId, preview]);

  useEffect(() => {
    if (access?.can_read) {
      void loadPageRange(1, PAGE_BATCH_SIZE);
    }
  }, [access, loadPageRange]);

  const bookUrl = bookId ? `${MAIN_APP_BASE_URL}/book/${bookId}` : MAIN_APP_BASE_URL;
  const expiresText = access?.expires_at
    ? `წვდომა მოქმედებს: ${new Date(access.expires_at).toLocaleDateString()}`
    : access?.access_type === 'scientific'
      ? 'მუდმივი წვდომა'
      : 'გადახედვის რეჟიმი';
  const disabledReaderCategories = access?.can_download
    ? ['annotation', 'form', 'redaction', 'insert']
    : ['annotation', 'form', 'redaction', 'insert', 'print', 'export', 'document-print', 'document-export'];
  const readerPageCount = totalPages ?? access?.total_pages ?? (preview ? access?.preview_pages : 1) ?? 1;
  const hasReaderPages = Object.keys(pages).length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFF2E]" />
      </div>
    );
  }

  if (error || !access) {
    return (
      <ReaderFailure
        title="მკითხველი მიუწვდომელია"
        message={error || 'მკითხველი დროებით მიუწვდომელია.'}
      />
    );
  }

  if (!access.can_read || !access.document_url) {
    const blockedText = access.status === 'expired'
      ? 'ამ წიგნზე წვდომის ვადა ამოიწურა.'
      : 'წიგნის სრულად წასაკითხად საჭიროა შეძენა.';

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl border-2 border-[#FFFF2E]/40 bg-black p-8 text-center space-y-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E]">{access.access_label}</p>
          <h1 className="text-4xl font-black uppercase leading-none">{access.title}</h1>
          <p className="text-sm text-gray-400">{blockedText}</p>
          <a className="inline-flex items-center justify-center gap-2 bg-[#FFFF2E] px-6 py-4 text-xs font-black uppercase text-black" href={bookUrl}>
            <ShoppingBag className="w-4 h-4" /> წიგნის გვერდი
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <main className="h-screen bg-neutral-950">
        {pagesError && !hasReaderPages ? (
          showPdfFallback ? (
            <ReaderPdfFallback
              access={access}
              disabledCategories={disabledReaderCategories}
              pagesError={pagesError}
            />
          ) : (
            <ReaderPagesFailure
              title={access.title}
              message={pagesError}
              documentUrl={access.document_url}
              onOpenPdf={() => setShowPdfFallback(true)}
            />
          )
        ) : (
          <Virtuoso
            className="h-[100dvh]"
            totalCount={readerPageCount}
            overscan={600}
            rangeChanged={({ startIndex, endIndex }) => {
              void loadPageRange(startIndex + 1, endIndex + 1 + PAGE_BATCH_SIZE);
            }}
            components={{
              Header: () => (
                <div className="mx-auto max-w-4xl px-4 pb-6 pt-8 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E]">
                    {access.mode === 'preview' ? 'ფრაგმენტი' : access.access_label}
                  </p>
                  <h1 className="mt-2 text-2xl font-black uppercase text-white md:text-4xl">{access.title}</h1>
                  <p className="mt-1 text-xs font-bold uppercase text-gray-500">{access.author}</p>
                </div>
              ),
              Footer: () => (
                <div className="px-4 py-10 text-center text-xs font-bold uppercase text-gray-500">
                  {loadingPages ? 'იტვირთება...' : pagesError ? pagesError : 'დასასრული'}
                </div>
              ),
            }}
            itemContent={(index) => {
              const pageNumber = index + 1;
              return (
                <ReaderPageView
                  key={pageNumber}
                  page={pages[pageNumber]}
                  pageNumber={pageNumber}
                />
              );
            }}
          />
        )}
      </main>
      <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl shadow-black/50 backdrop-blur md:max-w-sm">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#FFFF2E]">
          {access.mode === 'preview' ? 'ფრაგმენტი' : access.access_label}
        </p>
        <p className="mt-1 truncate text-sm font-black uppercase leading-tight">{access.title}</p>
        <p className="truncate text-[10px] font-bold uppercase text-gray-500">{access.author} · {expiresText}</p>
        <div className="mt-3 flex items-center gap-2">
          <a className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase text-white hover:border-[#FFFF2E] hover:text-[#FFFF2E]" href={bookUrl}>
            <ShoppingBag className="h-3.5 w-3.5" /> წიგნი
          </a>
          {access.can_download && access.download_url && (
            <a className="inline-flex items-center gap-2 rounded-full bg-[#FFFF2E] px-3 py-2 text-[10px] font-black uppercase text-black" href={access.download_url}>
              <Download className="h-3.5 w-3.5" /> PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const ReaderLoading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-[100dvh] items-center justify-center gap-3 bg-neutral-950 text-sm font-bold uppercase text-white">
    <Loader2 className="h-5 w-5 animate-spin text-[#FFFF2E]" />
    {label}
  </div>
);

const ReaderFailure: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
    <div className="max-w-lg space-y-4 border-2 border-red-500/50 bg-black p-8 text-center">
      <h1 className="text-3xl font-black uppercase">{title}</h1>
      <p className="text-sm text-gray-400">{message}</p>
      <a className="inline-block bg-[#FFFF2E] px-5 py-3 text-xs font-black uppercase text-black" href={MAIN_APP_BASE_URL}>
        Quaduni-ზე დაბრუნება
      </a>
    </div>
  </div>
);

const ReaderPdfFallback: React.FC<{
  access: ReaderAccessResponse;
  disabledCategories: string[];
  pagesError: string;
}> = ({ access, disabledCategories, pagesError }) => (
  <div className="relative h-[100dvh] bg-white">
    <Suspense fallback={<ReaderLoading label="PDF იტვირთება..." />}>
      <LazyPDFViewer
        config={{
          src: access.document_url,
          disabledCategories,
          permissions: {
            enforceDocumentPermissions: false,
            overrides: {
              print: access.can_download,
              printHighQuality: access.can_download,
              copyContents: access.can_download,
            },
          },
          tabBar: 'never',
          theme: { preference: 'dark' },
        }}
        className="h-[100dvh] w-full bg-white"
      />
    </Suspense>
    <div className="pointer-events-none fixed left-4 top-4 z-50 max-w-sm rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl shadow-black/50 backdrop-blur">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#FFFF2E]">PDF რეჟიმი</p>
      <p className="mt-1 truncate text-sm font-black uppercase leading-tight">{access.title}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-gray-500">{pagesError}</p>
    </div>
  </div>
);

const ReaderPagesFailure: React.FC<{
  title: string;
  message: string;
  documentUrl: string;
  onOpenPdf: () => void;
}> = ({ title, message, documentUrl, onOpenPdf }) => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 p-6 text-white">
    <div className="max-w-xl space-y-5 border-2 border-[#FFFF2E]/40 bg-black p-8 text-center shadow-2xl shadow-black/50">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E]">მკითხველი</p>
      <h1 className="text-3xl font-black uppercase leading-none md:text-4xl">{title}</h1>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-gray-400">{message}</p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          className="inline-flex items-center justify-center bg-[#FFFF2E] px-5 py-3 text-xs font-black uppercase text-black"
          onClick={onOpenPdf}
        >
          PDF რეჟიმი
        </button>
        <a className="inline-flex items-center justify-center border border-white/15 px-5 py-3 text-xs font-black uppercase text-white hover:border-[#FFFF2E] hover:text-[#FFFF2E]" href={documentUrl}>
          PDF გახსნა
        </a>
      </div>
    </div>
  </div>
);

const ReaderPageView = React.memo(function ReaderPageView({ page, pageNumber }: { page?: ReaderPage; pageNumber: number }) {
  const html = useMemo(() => sanitizeBookHTML(page?.html || ''), [page?.html]);

  return (
    <article className="mx-auto mb-5 max-w-4xl px-3 md:px-6">
      <div className="overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-2xl shadow-black/30 ring-1 ring-black/10">
        <div className="border-b border-neutral-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
          გვერდი {pageNumber}
        </div>
        {!page ? (
          <div className="flex min-h-[60vh] items-center justify-center text-xs font-bold uppercase text-neutral-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            იტვირთება
          </div>
        ) : page.render_mode === 'image' && page.image_url ? (
          <img
            src={page.image_url}
            alt={`Page ${pageNumber}`}
            className="mx-auto block h-auto max-h-none w-full bg-white object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="prose prose-neutral max-w-none px-6 py-8 text-[17px] leading-8 md:px-12 md:py-12 md:text-[19px] md:leading-9"
            dangerouslySetInnerHTML={{ __html: html || '<p></p>' }}
          />
        )}
      </div>
    </article>
  );
});
