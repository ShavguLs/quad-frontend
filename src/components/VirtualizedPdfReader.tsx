import React, { useEffect, useState, useRef, useTransition, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { Virtuoso } from 'react-virtuoso';
import { LoadingSpinner } from './LoadingSpinner';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface VirtualizedPdfReaderProps {
  pdfUrl: string;
  onError?: (error: string) => void;
}

const getInitialZoom = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? 0.75 : 1;
  }
  return 1;
};

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message || '';

    if (msg.includes('403') || msg.includes('Forbidden')) {
      return 'ACCESS_DENIED';
    }
    if (msg.includes('404') || msg.includes('Not Found')) {
      return 'PDF_NOT_FOUND';
    }
    if (msg.includes('Invalid PDF') || msg.includes('Bad PDF')) {
      return 'INVALID_PDF';
    }
    if (msg.includes('password') || msg.includes('encrypted')) {
      return 'PDF_PASSWORD_PROTECTED';
    }
    if (
      msg.includes('NetworkError') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Network request')
    ) {
      return 'NETWORK_ERROR';
    }
    return msg || 'PDF_LOAD_FAILED';
  }
  return 'PDF_LOAD_FAILED';
}

export const VirtualizedPdfReader: React.FC<VirtualizedPdfReaderProps> = ({ pdfUrl, onError }) => {
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(getInitialZoom());
  const [zoomIndex, setZoomIndex] = useState<number>(() => {
    const initial = getInitialZoom();
    return ZOOM_LEVELS.indexOf(initial) >= 0 ? ZOOM_LEVELS.indexOf(initial) : 2;
  });
  const [isPending, startTransition] = useTransition();

  const loadPdf = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const run = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: true,
          disableRange: false,
          disableStream: false,
          disableAutoFetch: true,
        });
        const doc = await loadingTask.promise;
        if (!cancelled) {
          setPdf(doc);
          setNumPages(doc.numPages);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMsg = getErrorMessage(err);
          console.error('Failed to load PDF:', err);
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        }
      }
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, onError]);

  useEffect(() => {
    const cleanup = loadPdf();
    return cleanup;
  }, [loadPdf]);

  // Clean up PDF on unmount separately so we don't destroy it prematurely
  useEffect(() => {
    return () => {
      if (pdf) {
        pdf.destroy().catch(() => {});
      }
    };
  }, [pdf]);

  const handleZoomIn = () => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      startTransition(() => {
        setZoomIndex(zoomIndex + 1);
        setZoomLevel(ZOOM_LEVELS[zoomIndex + 1]);
      });
    }
  };

  const handleZoomOut = () => {
    if (zoomIndex > 0) {
      startTransition(() => {
        setZoomIndex(zoomIndex - 1);
        setZoomLevel(ZOOM_LEVELS[zoomIndex - 1]);
      });
    }
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center px-6 max-w-md">
          <div className="text-3xl mb-4">⚠</div>
          <p className="text-sm font-bold tracking-[0.1em] text-white/70 mb-4">
            წიგნის ჩატვირთვა ვერ მოხერხდა
          </p>
          <p className="text-xs text-white/50 mb-6">
            {error === 'ACCESS_DENIED'
              ? 'თქვენ არ გაქვთ ამ წიგნის წაკითხვის უფლება.'
              : error === 'PDF_NOT_FOUND'
                ? 'წიგნის ფაილი ვერ მოიძებნა.'
                : error === 'NETWORK_ERROR'
                  ? 'ქსელის შეცდომა. გთხოვთ, სცადოთ თავიდან.'
                  : error === 'INVALID_PDF'
                    ? 'წიგნის ფაილი დაზიანებულია.'
                    : 'შეცდომა მოხდა წიგნის ჩატვირთვისას.'}
          </p>
          <button
            onClick={loadPdf}
            className="border-2 border-[#FFFF2E] bg-transparent text-[#FFFF2E] px-6 py-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#FFFF2E] hover:text-black transition-all"
          >
            თავიდან ცდა
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !pdf || numPages === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <LoadingSpinner className="w-8 h-8 text-[#FFFF2E] mr-4" />
        <span className="text-xs font-black uppercase tracking-[0.2em]">Loading PDF...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 bg-black/80 px-4 py-2 border border-white/20 backdrop-blur-sm rounded-full shadow-2xl items-center">
        <button onClick={handleZoomOut} disabled={zoomIndex === 0} className="text-white hover:text-[#FFFF2E] disabled:opacity-30 disabled:hover:text-white px-2 font-black text-xl transition-colors">-</button>
        <span className="text-white text-xs font-bold leading-6 min-w-[3rem] text-center tracking-[0.1em] opacity-80">{Math.round(zoomLevel * 100)}%</span>
        <button onClick={handleZoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1} className="text-white hover:text-[#FFFF2E] disabled:opacity-30 disabled:hover:text-white px-2 font-black text-xl transition-colors">+</button>
      </div>
      
      <Virtuoso
        totalCount={numPages}
        className="w-full h-full scroll-smooth"
        style={{ height: '100%' }}
        itemContent={(index) => (
          <PdfPage
            key={`${index}-${zoomLevel}`}
            pdf={pdf}
            pageNumber={index + 1}
            zoomLevel={zoomLevel}
          />
        )}
      />
    </div>
  );
};

interface PdfPageProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  zoomLevel: number;
}

const PdfPage: React.FC<PdfPageProps> = ({ pdf, pageNumber, zoomLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: zoomLevel });
        setDimensions({ width: viewport.width, height: viewport.height });

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d', { alpha: false });
          
          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
              background: 'white',
            };

            renderTaskRef.current = page.render(renderContext);
            await renderTaskRef.current.promise;
          }
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, zoomLevel]);

  return (
    <div className="flex justify-center w-full my-6">
      <div 
        className="bg-white shadow-xl relative"
        style={{
          width: dimensions ? dimensions.width : Math.floor(600 * zoomLevel),
          height: dimensions ? dimensions.height : Math.floor(800 * zoomLevel),
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block max-w-full" />
      </div>
    </div>
  );
};