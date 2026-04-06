import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';

import { SEOMeta } from './SEOMeta';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getAdPath } from '../lib/seo';
import { api } from '../services/api';
import type { AdListItem, AdPublisher } from '../types';

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'ყველა' },
  { value: 'promo', label: 'პრომო' },
  { value: 'announcement', label: 'ანონსი' },
  { value: 'showcase', label: 'შოუქეისი' },
  { value: 'news', label: 'სიახლე' },
];

const getPublisherName = (publisher: AdPublisher): string => (
  publisher.display_name?.trim() || publisher.handle
);

const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const makeExcerpt = (ad: AdListItem): string => {
  const source = ad.excerpt?.trim() || '';
  if (source) return source;
  return '';
};

export const BlogPage: React.FC = () => {
  const [ads, setAds] = useState<AdListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [publisher, setPublisher] = useState('');

  const [publishers, setPublishers] = useState<AdPublisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, publisher]);

  useEffect(() => {
    let cancelled = false;

    const loadFilters = async () => {
      setIsLoadingFilters(true);
      try {
        const publisherData = await api.getAdPublishers();
        if (!cancelled) {
          setPublishers(publisherData);
        }
      } catch {
        if (!cancelled) {
          setPublishers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFilters(false);
        }
      }
    };

    loadFilters();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAds = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.getAds({
          page,
          search: debouncedSearch || undefined,
          category: category || undefined,
          publisher: publisher || undefined,
        });

        if (!cancelled) {
          setAds(response.results || []);
          setCount(response.count || 0);
          setNextUrl(response.next);
          setPreviousUrl(response.previous);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'BLOG_UNAVAILABLE';
          setError(message);
          setAds([]);
          setCount(0);
          setNextUrl(null);
          setPreviousUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAds();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, publisher]);

  const totalPages = useMemo(() => {
    if (!count) return 1;
    return Math.max(1, Math.ceil(count / 20));
  }, [count]);

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-black text-white">
      <SEOMeta
        title="ბლოგი"
        description="გამომცემლების განცხადებები, ანონსები და სიახლეები Quaduni-ზე."
        canonical="/blog/"
        type="website"
      />

      <div className="container mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-4 text-[#FFFF2E] font-black uppercase text-xs tracking-widest mb-4">
            <span className="w-12 h-[2px] bg-[#FFFF2E]" />
            ბლოგი
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85]">რეკლამები</h1>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-gray-500">პუბლიკაციები გამომცემლებისგან</p>
        </header>

        <section className="sticky top-24 z-30 border-2 bg-black/95 backdrop-blur-sm md:p-6 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
            <div className="lg:col-span-4 flex items-center gap-3 border-2 border-white/10 px-4 py-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="სათაურით ძიება..."
                className="w-full bg-transparent outline-none text-sm font-bold placeholder:text-gray-600"
              />
            </div>

            <div className="lg:col-span-5 flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value || 'all'}
                  onClick={() => setCategory(option.value)}
                  className={`px-3 py-2 border text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    category === option.value
                      ? 'border-[#FFFF2E] bg-[#FFFF2E] text-black'
                      : 'border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="lg:col-span-3">
              <select
                value={publisher}
                onChange={(event) => setPublisher(event.target.value)}
                disabled={isLoadingFilters}
                className="w-full bg-black border-2 border-white/10 px-3 py-3 text-xs font-black uppercase tracking-widest focus:border-[#FFFF2E] outline-none"
              >
                <option value="">ყველა გამომცემელი</option>
                {publishers.map((item) => (
                  <option key={item.id} value={item.handle.toLowerCase()}>
                    {getPublisherName(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-8 border-2 border-red-600/40 bg-red-600/10 text-red-500 p-4 text-[10px] font-black uppercase tracking-widest">
            ბლოგის ჩატვირთვა ვერ მოხერხდა: {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFFF2E]" />
          </div>
        ) : ads.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-white/10">
            <h2 className="text-2xl font-black uppercase text-gray-500">პოსტები ვერ მოიძებნა</h2>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {ads.map((ad) => {
                const excerpt = makeExcerpt(ad);
                return (
                  <article key={ad.id} className="h-[220px] md:h-[230px] border-2 border-white/10 bg-zinc-950 overflow-hidden group flex flex-col">
                    <Link to={getAdPath(ad.slug)}>
                      <div className="h-24 md:h-28 overflow-hidden bg-zinc-900">
                        {ad.image ? (
                          <ImageWithFallback
                            src={ad.image}
                            alt={ad.title}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            No image
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-h-0 px-4 py-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="inline-flex items-center rounded-sm border border-black/20 text-[9px] font-black uppercase tracking-[0.18em] bg-[#FFFF2E] text-black px-2.5 py-1.5 leading-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.35)]">
                          {ad.category}
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          {ad.publisher.profile_image ? (
                            <ImageWithFallback
                              src={ad.publisher.profile_image}
                              alt={getPublisherName(ad.publisher)}
                              className="w-6 h-6 rounded-full object-cover border border-white/20"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#FFFF2E] text-black flex items-center justify-center text-[10px] font-black">
                              {getPublisherName(ad.publisher).charAt(0)}
                            </div>
                          )}
                          <span className="text-[10px] font-black uppercase text-gray-300 truncate">{getPublisherName(ad.publisher)}</span>
                        </div>
                      </div>

                      <h2
                        className="text-sm font-black uppercase tracking-tight leading-tight group-hover:text-[#FFFF2E] transition-colors"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        <Link to={getAdPath(ad.slug)}>{ad.title}</Link>
                      </h2>


                      {excerpt && (
                        <p
                          className="hidden md:block text-[11px] text-gray-400 leading-relaxed"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {stripHtml(excerpt)}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!previousUrl}
                className="px-4 py-2 border-2 border-white/20 text-xs font-black uppercase tracking-[0.2em] disabled:opacity-30"
              >
                წინა
              </button>

              <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                გვერდი {page} / {totalPages}
              </div>

              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={!nextUrl}
                className="px-4 py-2 border-2 border-[#FFFF2E] text-xs font-black uppercase tracking-[0.2em] text-[#FFFF2E] disabled:opacity-30"
              >
                შემდეგი
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
