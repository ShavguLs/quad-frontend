import React, { useEffect, useMemo, useState } from 'react';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import { Download, Loader2, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import type { ReaderAccessResponse } from '../types';

const MAIN_APP_BASE_URL = (import.meta.env.VITE_MAIN_APP_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://quaduni.com';

const resolveBookId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const [bookId] = window.location.pathname.replace(/^\/+/, '').split('/');
  return bookId || null;
};

export const ReaderSubdomainApp: React.FC = () => {
  const bookId = useMemo(resolveBookId, []);
  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
  const [access, setAccess] = useState<ReaderAccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!access?.can_read || !access.document_url) {
      setDocumentUrl(null);
      setDocumentError(null);
      setDocumentLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setDocumentUrl(null);
    setDocumentError(null);
    setDocumentLoading(true);

    fetch(access.document_url, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(response.status === 403
            ? 'ამ დოკუმენტზე წვდომა შეზღუდულია. გთხოვთ თავიდან შეხვიდეთ ანგარიშში.'
            : 'დოკუმენტის ჩატვირთვა ვერ მოხერხდა.');
        }

        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setDocumentUrl(objectUrl);
      })
      .catch((err: unknown) => {
        if (!cancelled) setDocumentError(err instanceof Error ? err.message : 'დოკუმენტის ჩატვირთვა ვერ მოხერხდა.');
      })
      .finally(() => {
        if (!cancelled) setDocumentLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [access]);

  const bookUrl = bookId ? `${MAIN_APP_BASE_URL}/book/${bookId}` : MAIN_APP_BASE_URL;
  const expiresText = access?.expires_at
    ? `წვდომა მოქმედებს: ${new Date(access.expires_at).toLocaleDateString()}`
    : access?.access_type === 'scientific'
      ? 'მუდმივი წვდომა'
      : 'გადახედვის რეჟიმი';
  const disabledReaderCategories = access?.can_download
    ? ['annotation', 'form', 'redaction', 'insert']
    : ['annotation', 'form', 'redaction', 'insert', 'print', 'export', 'document-print', 'document-export'];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFF2E]" />
      </div>
    );
  }

  if (error || !access) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg border-2 border-red-500/50 bg-black p-8 text-center space-y-4">
          <h1 className="text-3xl font-black uppercase">მკითხველი მიუწვდომელია</h1>
          <p className="text-sm text-gray-400">{error}</p>
          <a className="inline-block bg-[#FFFF2E] px-5 py-3 text-xs font-black uppercase text-black" href={MAIN_APP_BASE_URL}>Quaduni-ზე დაბრუნება</a>
        </div>
      </div>
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

  if (documentLoading || documentError || !documentUrl) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg border-2 border-white/10 bg-black p-8 text-center space-y-4">
          {documentLoading ? (
            <Loader2 className="mx-auto w-8 h-8 animate-spin text-[#FFFF2E]" />
          ) : (
            <h1 className="text-3xl font-black uppercase">დოკუმენტი მიუწვდომელია</h1>
          )}
          <p className="text-sm text-gray-400">{documentError || 'დოკუმენტი იტვირთება...'}</p>
          {documentError && (
            <a className="inline-block bg-[#FFFF2E] px-5 py-3 text-xs font-black uppercase text-black" href={bookUrl}>წიგნის გვერდი</a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <header className="border-b border-white/10 bg-black px-4 py-3 md:px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFFF2E]">Quaduni Reader // {access.mode === 'preview' ? 'ფრაგმენტი' : access.access_label}</p>
          <h1 className="mt-1 text-lg md:text-2xl font-black uppercase leading-tight">{access.title}</h1>
          <p className="text-xs font-bold uppercase text-gray-500">{access.author} · {expiresText}</p>
        </div>
        <div className="flex items-center gap-3">
          <a className="border border-white/20 px-4 py-3 text-[10px] font-black uppercase text-white hover:border-[#FFFF2E] hover:text-[#FFFF2E]" href={bookUrl}>წიგნის გვერდი</a>
          {access.can_download && access.download_url && (
            <a className="inline-flex items-center gap-2 bg-[#FFFF2E] px-4 py-3 text-[10px] font-black uppercase text-black" href={access.download_url}>
              <Download className="w-4 h-4" /> ჩამოტვირთვა
            </a>
          )}
        </div>
      </header>
      <main className="flex-1 bg-neutral-900">
        <PDFViewer
          config={{
            src: documentUrl,
            disabledCategories: disabledReaderCategories,
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
          className="h-[calc(100vh-120px)] min-h-[620px] w-full bg-white"
        />
      </main>
    </div>
  );
};
