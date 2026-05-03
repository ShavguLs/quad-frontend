import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../services/api';
import type { Book } from '../types';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { VirtualizedPdfReader } from './VirtualizedPdfReader';
import { SEOMeta } from './SEOMeta';
import { getBookPath } from '../lib/seo';

export const BookPreviewPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) {
      setError('Book ID is missing.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const metadata = await api.getBook(bookId);
        if (cancelled) return;
        setBook(metadata);

        const endpoint = `${API_BASE_URL}/books/${bookId}/preview/`;
        setPdfUrl(endpoint);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'FAILED_TO_LOAD_PREVIEW';
        setError(msg);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col pt-32 pb-24 px-6 items-center justify-center">
        <LoadingSpinner className="w-12 h-12 text-[#FFFF2E] mb-6" />
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E] animate-pulse">
          პრევიუ იტვირთება...
        </div>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6 flex flex-col items-center">
        <SEOMeta
          title="პრევიუ მიუწვდომელია"
          description="წიგნის პრევიუ ვერ მოიძებნა."
          noindex
        />
        <div className="container mx-auto max-w-3xl border-4 border-white bg-white/[0.03] p-8 md:p-12 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-red-400 mb-6">
            შეცდომა
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[-0.08em] mb-4">
            პრევიუ მიუწვდომელია
          </h1>
          <p className="text-sm md:text-base font-bold tracking-[0.16em] text-white/60 mb-10">
            {error === 'FAILED_TO_LOAD_PREVIEW' ? 'წიგნის პრევიუ ვერ მოიძებნა ან არ არსებობს.' : error}
          </p>
          {book && (
            <Link
              to={getBookPath(book)}
              className="inline-block border-4 border-[#FFFF2E] bg-[#FFFF2E] px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-black transition-transform hover:-translate-y-1"
            >
              წიგნის გვერდზე დაბრუნება
            </Link>
          )}
          {!book && (
            <button
              onClick={() => navigate('/books')}
              className="border-4 border-[#FFFF2E] bg-[#FFFF2E] px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-black transition-transform hover:-translate-y-1"
            >
              კატალოგში დაბრუნება
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-black" style={{ height: '100vh' }}>
      <SEOMeta
        title={`${book?.title || 'წიგნი'} — პრევიუ`}
        description="წიგნის პირველი გვერდების წინასწარი ნახვა — Quaduni"
        noindex
      />
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 lg:px-6 bg-black z-10 shrink-0">
        <Link
          to={book ? getBookPath(book) : '/books'}
          className="flex items-center gap-2 text-white hover:text-[#FFFF2E] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline truncate max-w-[200px]">
            {book?.title || 'უკან დაბრუნება'}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FFFF2E]">
            პრევიუ
          </span>
          <BookOpen className="w-4 h-4 text-[#FFFF2E]" />
        </div>
        {book && (
          <Link
            to={getBookPath(book)}
            className="text-[10px] font-black uppercase tracking-widest text-white hover:text-[#FFFF2E] transition-colors"
          >
            ყიდვა
          </Link>
        )}
        {!book && <div className="w-8" />}
      </div>

      <div className="bg-[#FFFF2E]/10 border-b border-[#FFFF2E]/20 px-4 py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFFF2E]/80">
        წიგნის პირველი გვერდების წინასწარი ნახვა — სრული ვერსიისთვის შეიძინეთ წიგნი
      </div>

      <div className="flex-1 min-h-0 w-full bg-[#111] overflow-hidden relative flex flex-col">
        <VirtualizedPdfReader
          pdfUrl={pdfUrl}
          initialPage={1}
        />
      </div>
    </div>
  );
};