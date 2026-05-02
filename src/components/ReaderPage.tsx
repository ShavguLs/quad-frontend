import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import { api } from '../services/api';
import type { Book, User } from '../types';
import { ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface ReaderPageProps {
  user: User | null;
  isAuthLoading: boolean;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ user, isAuthLoading }) => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/login', { state: { returnTo: `/reader/${bookId}` } });
      return;
    }

    if (!bookId) {
      setError('Book ID is missing.');
      setIsLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const loadReader = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch metadata
        const metadata = await api.getBook(bookId);
        if (cancelled) return;
        setBook(metadata);

        // Fetch PDF Blob
        const blob = await api.readBookPdf(bookId);
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'FAILED_TO_LOAD_PDF';
        setError(msg);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadReader();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bookId, user, isAuthLoading, navigate]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col pt-32 pb-24 px-6 items-center justify-center">
        <LoadingSpinner className="w-12 h-12 text-[#FFFF2E] mb-6" />
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E] animate-pulse">
          წიგნი იტვირთება...
        </div>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="container mx-auto max-w-3xl border-4 border-white bg-white/[0.03] p-8 md:p-12 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-red-400 mb-6">
            შეცდომა
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[-0.08em] mb-4">
            წიგნის გახსნა შეუძლებელია
          </h1>
          <p className="text-sm md:text-base font-bold tracking-[0.16em] text-white/60 mb-10">
            {error === 'FAILED_TO_LOAD_PDF' ? 'წიგნის ჩამოტვირთვა ვერ მოხერხდა ან თქვენ არ გაქვთ წვდომა.' : error}
          </p>
          <button
            onClick={() => navigate(book ? `/book/${book.id}` : '/library')}
            className="border-4 border-[#FFFF2E] bg-[#FFFF2E] px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-black transition-transform hover:-translate-y-1"
          >
            უკან დაბრუნება
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 lg:px-6 bg-black z-10 shrink-0">
        <button
          onClick={() => navigate(book ? `/book/${book.id}` : '/library')}
          className="flex items-center gap-2 text-white hover:text-[#FFFF2E] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">
            {book?.title || 'უკან დაბრუნება'}
          </span>
        </button>
        <div className="text-xs font-bold tracking-[0.15em] text-white/50 hidden md:block">
          {book?.author}
        </div>
        <div className="w-8"></div>
      </div>
      
      <div className="flex-1 w-full bg-[#111] overflow-hidden relative">
        <PDFViewer
          config={{
            src: pdfUrl,
            theme: { preference: 'dark' },
            ui: {
              features: {
                download: false,
                print: false,
                export: false,
              }
            }
          }}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
