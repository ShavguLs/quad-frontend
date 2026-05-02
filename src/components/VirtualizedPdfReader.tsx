import React, { useEffect, useState, useRef, useTransition, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { ZoomIn, ZoomOut, Maximize2, Maximize, Minimize, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [, startTransition] = useTransition();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePageError = useCallback((err: unknown) => {
    const errorMsg = getErrorMessage(err);
    setError(errorMsg);
    onError?.(errorMsg);
  }, [onError]);

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

  const handleFitWidth = async () => {
    if (!pdfContainerRef.current || !pdf) return;
    
    // Calculate available width directly from the PDF container
    const availableWidth = pdfContainerRef.current.clientWidth;
    
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const calculatedZoom = availableWidth / viewport.width;
      
      const minZoom = ZOOM_LEVELS[0];
      const maxZoom = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
      const clampedZoom = Math.max(minZoom, Math.min(calculatedZoom, maxZoom));
      
      startTransition(() => {
        setZoomLevel(clampedZoom);
        
        let nearestIdx = 0;
        let minDiff = Infinity;
        ZOOM_LEVELS.forEach((level, idx) => {
          const diff = Math.abs(level - clampedZoom);
          if (diff < minDiff) {
            minDiff = diff;
            nearestIdx = idx;
          }
        });
        setZoomIndex(nearestIdx);
      });
    } catch (err) {
      console.error('Failed to calculate fit width:', err);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  const goToPage = (pageStr: string) => {
    const page = parseInt(pageStr, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      virtuosoRef.current?.scrollToIndex({ index: page - 1, align: 'start' });
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      goToPage((currentPage + 1).toString());
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      goToPage((currentPage - 1).toString());
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      goToPage(pageInput);
    }
  };

  if (error) {
    return (
      <div className="flex-1 w-full flex items-center justify-center text-white">
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
      <div className="flex-1 w-full flex items-center justify-center text-white">
        <LoadingSpinner className="w-8 h-8 text-[#FFFF2E] mr-4" />
        <span className="text-xs font-black uppercase tracking-[0.2em]">Loading PDF...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0 w-full flex relative overflow-hidden bg-zinc-950">
      <div ref={pdfContainerRef} className="flex-1 min-h-0 w-full relative">
        <Virtuoso
          ref={virtuosoRef}
          totalCount={numPages}
          style={{ height: '100%', width: '100%' }}
          className="scroll-smooth"
          rangeChanged={(range) => {
            const midpoint = Math.floor((range.startIndex + range.endIndex) / 2);
            setCurrentPage(midpoint + 1);
          }}
          itemContent={(index) => (
            <PdfPage
              key={`${index}-${zoomLevel}`}
              pdf={pdf}
              pageNumber={index + 1}
              zoomLevel={zoomLevel}
              onError={handlePageError}
            />
          )}
        />
      </div>

      <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center bg-black border-2 border-white w-14 md:w-16">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          title="წინა გვერდი"
          className="w-full flex items-center justify-center py-2 text-white hover:bg-[#FFFF2E] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white transition-all"
        >
          <ChevronUp size={18} strokeWidth={3} />
        </button>

        <div className="w-full border-t border-b border-white/30 flex flex-col items-center py-2 gap-0.5">
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputKeyDown}
            onBlur={() => setPageInput(currentPage.toString())}
            className="w-8 bg-transparent text-white text-center text-[11px] font-black focus:outline-none focus:text-[#FFFF2E] border-b border-transparent focus:border-[#FFFF2E]"
          />
          <span className="text-white/40 text-[9px] font-black tracking-[0.1em]">/ {numPages}</span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
          title="შემდეგი გვერდი"
          className="w-full flex items-center justify-center py-2 text-white hover:bg-[#FFFF2E] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white transition-all border-b border-white/30"
        >
          <ChevronDown size={18} strokeWidth={3} />
        </button>

        <button
          onClick={handleZoomIn}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          title="გადიდება"
          className="w-full flex items-center justify-center py-2 text-white hover:bg-[#FFFF2E] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white transition-all"
        >
          <ZoomIn size={16} strokeWidth={2.5} />
        </button>

        <div className="w-full flex items-center justify-center py-1.5 border-t border-b border-white/30">
          <span className="text-[9px] font-black tracking-[0.15em] text-[#FFFF2E]">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        <button
          onClick={handleZoomOut}
          disabled={zoomIndex === 0}
          title="დაპატარავება"
          className="w-full flex items-center justify-center py-2 text-white hover:bg-[#FFFF2E] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white transition-all border-b border-white/30"
        >
          <ZoomOut size={16} strokeWidth={2.5} />
        </button>

        <button
          onClick={handleFitWidth}
          title="სიგანეზე მორგება"
          className="w-full flex items-center justify-center py-2 text-white hover:bg-[#FFFF2E] hover:text-black transition-all border-b border-white/30"
        >
          <Maximize2 size={16} strokeWidth={2.5} />
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'სრული ეკრანიდან გამოსვლა' : 'სრული ეკრანი'}
          className="w-full flex items-center justify-center py-2 text-white hover:bg-[#FFFF2E] hover:text-black transition-all"
        >
          {isFullscreen ? <Minimize size={16} strokeWidth={2.5} /> : <Maximize size={16} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
};

interface PdfPageProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  zoomLevel: number;
  onError: (error: unknown) => void;
}

const PdfPage: React.FC<PdfPageProps> = ({ pdf, pageNumber, zoomLevel, onError }) => {
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
      } catch (err: unknown) {
        const isRenderCancelled = err instanceof Error && err.name === 'RenderingCancelledException';
        if (!isRenderCancelled) {
          console.error(`Error rendering page ${pageNumber}:`, err);
          if (!cancelled) {
            onError(err);
          }
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
  }, [pdf, pageNumber, zoomLevel, onError]);

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
