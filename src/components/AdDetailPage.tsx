import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp, Loader2 } from 'lucide-react';

import { SEOMeta } from './SEOMeta';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { buildAdJsonLd, getAdPath } from '../lib/seo';
import { api } from '../services/api';
import { sanitizeBookHTML } from '../services/htmlSanitizer';
import type { Ad } from '../types';

const getPublisherName = (ad: Ad): string => ad.publisher.display_name?.trim() || ad.publisher.handle;

const extractTextFromNode = (node: unknown): string => {
  if (!node || typeof node !== 'object') {
    return '';
  }

  const record = node as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text : '';
  const content = Array.isArray(record.content) ? record.content.map(extractTextFromNode).join('') : '';
  const joined = `${text}${content}`;

  if (record.type === 'paragraph') {
    return `${joined}\n\n`;
  }

  return joined;
};

const renderAdContent = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed) {
    return '<p></p>';
  }

  if (trimmed.startsWith('<')) {
    return sanitizeBookHTML(trimmed);
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const text = extractTextFromNode(parsed)
        .split('\n\n')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => `<p>${chunk}</p>`)
        .join('');

      return sanitizeBookHTML(text || '<p></p>');
    } catch {
      return sanitizeBookHTML(`<p>${trimmed}</p>`);
    }
  }

  return sanitizeBookHTML(`<p>${trimmed}</p>`);
};

export const AdDetailPage: React.FC = () => {
  const { slug } = useParams();
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('AD_NOT_FOUND');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadAd = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.getAd(slug);
        if (!cancelled) {
          setAd(response);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'AD_NOT_FOUND';
          setError(message);
          setAd(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAd();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const html = useMemo(() => (ad ? renderAdContent(ad.content) : ''), [ad]);
  const jsonLd = useMemo(() => (ad ? buildAdJsonLd(ad) : undefined), [ad]);

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 px-6 min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFF2E]" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="pt-32 pb-24 px-6 min-h-screen bg-black text-white">
        <SEOMeta
          title="რეკლამა ვერ მოიძებნა"
          description="მოთხოვნილი ბლოგის ჩანაწერი ვერ მოიძებნა."
          canonical={slug ? getAdPath(slug) : '/blog'}
          noindex
        />
        <div className="container mx-auto max-w-3xl border-2 border-white/10 p-8">
          <h1 className="text-3xl font-black uppercase">ჩანაწერი ვერ მოიძებნა</h1>
          <p className="mt-4 text-sm uppercase tracking-[0.15em] text-gray-500">{error || 'NOT_FOUND'}</p>
          <Link to="/blog" className="inline-flex mt-8 items-center gap-2 text-[#FFFF2E] font-black uppercase text-xs tracking-widest">
            <ArrowLeft className="w-4 h-4" /> უკან ბლოგზე
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-black text-white">
      <SEOMeta
        title={ad.seo_title || ad.title}
        description={ad.seo_description || ad.title}
        keywords={ad.seo_keywords || undefined}
        canonical={getAdPath(ad.slug)}
        image={ad.image || undefined}
        ogImageAlt={ad.title}
        type="article"
        jsonLd={jsonLd}
      />

      <div className="container mx-auto max-w-4xl">
        <Link to="/blog" className="inline-flex items-center gap-2 mb-8 text-[#FFFF2E] font-black uppercase text-xs tracking-widest">
          <ArrowLeft className="w-4 h-4" /> უკან ბლოგზე
        </Link>

        <header className="space-y-4 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
            <span className="bg-[#FFFF2E] text-black px-2 py-1">{ad.category}</span>
            <span className="text-gray-500">{new Date(ad.created_at).toLocaleDateString('ka-GE')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-[0.9]">{ad.title}</h1>
          <div className="flex items-center gap-3">
            {ad.publisher.profile_image ? (
              <ImageWithFallback
                src={ad.publisher.profile_image}
                alt={getPublisherName(ad)}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#FFFF2E] text-black flex items-center justify-center font-black">
                {getPublisherName(ad).charAt(0)}
              </div>
            )}
            <div className="text-xs font-black uppercase tracking-wider text-gray-400">{getPublisherName(ad)}</div>
          </div>
        </header>

        {ad.image && (
          <div className="mt-8 border-2 border-white/10 overflow-hidden">
            <ImageWithFallback src={ad.image} alt={ad.title} className="w-full h-auto object-cover" />
          </div>
        )}

        <article
          className="mt-10 prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 border-2 border-[#FFFF2E] text-[#FFFF2E] px-4 py-2 text-xs font-black uppercase tracking-widest"
          >
            <ArrowUp className="w-4 h-4" /> ზემოთ დაბრუნება
          </button>
        </div>
      </div>
    </div>
  );
};
