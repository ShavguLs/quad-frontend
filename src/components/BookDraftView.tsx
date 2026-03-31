import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Monitor,
  Palette,
  Sparkles,
  Type,
  Check,
  SlidersHorizontal,
  Eye,
  Zap,
  Loader2,
  CheckCircle,
  Image,
} from 'lucide-react';
import { api } from '../services/api';
import {
  fontOptions,
  paletteOptions,
  animationOptions,
  backgroundOptions,
} from '../constants/draftStudioTheme';
import type { AnimationEffect } from '../constants/draftStudioTheme';

interface BookDraftViewProps {
  bookId: string;
  onBack: () => void;
}

type DraftTab = 'fonts' | 'colors' | 'animations' | 'backgrounds';


/* ── Animation Overlay Component ── */
const DraftAnimationOverlay: React.FC<{ effect: AnimationEffect; accent: string }> = ({ effect, accent }) => {
  if (effect === 'none' || effect === 'vortex') return null;

  const particles = useMemo<any[]>(() => {
    if (effect === 'snow') {
      return Array.from({ length: 45 }, (_, i) => {
        const dur = 8 + Math.random() * 10;
        return {
          id: i,
          x: Math.random() * 100,
          y: -5,
          originX: 0,
          originY: 0,
          isPlanet: false,
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
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          originX: 0,
          originY: 0,
          isPlanet: false,
          size: 30 + Math.random() * 40,
          delay: -(Math.random() * dur),
          duration: dur,
        };
      });
    }
    if (effect === 'vortex') {
      const stars = Array.from({ length: 72 }, (_, i) => ({
        id: `star-${i}`,
        type: 'star',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.8 + Math.random() * 2.2,
        opacity: 0.25 + Math.random() * 0.65,
        duration: 2.2 + Math.random() * 3.8,
        delay: -(Math.random() * 4),
      }));

      const nebulae = [
        { id: 'nebula-1', type: 'nebula', x: 22, y: 24, size: 420, opacity: 0.16, color: '#2f7fff' },
        { id: 'nebula-2', type: 'nebula', x: 78, y: 70, size: 460, opacity: 0.14, color: '#8c4bff' },
        { id: 'nebula-3', type: 'nebula', x: 52, y: 48, size: 360, opacity: 0.1, color: '#42d7ff' },
      ];

      const comets = Array.from({ length: 4 }, (_, i) => ({
        id: `comet-${i}`,
        type: 'comet',
        y: 8 + Math.random() * 55,
        duration: 5 + Math.random() * 4,
        delay: i * 2.8 + Math.random() * 2,
        length: 90 + Math.random() * 50,
      }));

      return [
        ...stars,
        ...nebulae,
        ...comets,
        { id: 'core', type: 'core', x: 50, y: 50 },
      ];
    }
    if (effect === 'sparkle') {
      return Array.from({ length: 60 }, (_, i) => {
        const dur = 2.5 + Math.random() * 4;
        const size = 1 + Math.random() * 2.5 + (Math.random() > 0.8 ? 1.5 : 0);
        return {
          id: i,
          x: Math.random() * 100,
          y: 95 + Math.random() * 15,
          originX: (Math.random() - 0.5) * 30, // total horizontal drift
          swayAmt: (Math.random() - 0.5) * 15, // horizontal sway curve
          isPlanet: false,
          size,
          delay: -(Math.random() * dur),
          duration: dur,
        };
      });
    }
    return [];
  }, [effect]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {effect === 'flare' && particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}vh`,
            height: `${p.size}vh`,
            background: `radial-gradient(circle, ${accent}80 0%, transparent 70%)`,
            filter: 'blur(40px)',
            mixBlendMode: 'screen',
            animation: `draftFlare ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {effect === 'snow' && particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: 'rgba(255,255,255,0.95)',
            clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
            animation: `draftSnow ${p.duration}s linear ${p.delay}s infinite`,
            willChange: 'transform',
          }}
        />
      ))}

      {effect === 'vortex' && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 120%, ${accent}22 0%, rgba(20,40,90,0.12) 45%, rgba(0,0,0,0) 85%)`,
            }}
          />

          {particles.filter((p) => p.type === 'nebula').map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
                opacity: p.opacity,
                animation: 'galaxyNebulaDrift 18s ease-in-out infinite alternate',
              }}
            />
          ))}

          {particles.filter((p) => p.type === 'core').map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: '140px',
                height: '140px',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle at 35% 35%, #fff 0%, ${accent} 30%, transparent 72%)`,
                opacity: 0.35,
                animation: 'galaxyCorePulse 4.5s ease-in-out infinite',
              }}
            />
          ))}

          {particles.filter((p) => p.type === 'star').map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: '#ffffff',
                opacity: p.opacity,
                boxShadow: `0 0 ${Math.max(2, p.size * 2)}px rgba(255,255,255,0.55)`,
                animation: `galaxyTwinkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}

          {particles.filter((p) => p.type === 'comet').map((p) => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: '110%',
                top: `${p.y}%`,
                width: `${p.length}px`,
                height: '2px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 45%, transparent 100%)',
                transform: 'rotate(-20deg)',
                animation: `galaxyComet ${p.duration}s linear ${p.delay}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {effect === 'sparkle' && particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: '#ffe299',
            boxShadow: `0 0 ${p.size * 3}px ${p.size * 1.5}px #ff5500, 0 0 ${p.size * 6}px ${p.size * 3}px rgba(255,20,0,0.6)`,
            mixBlendMode: 'screen',
            animation: `draftFireEmber ${p.duration}s ease-out ${p.delay}s infinite`,
            willChange: 'transform, opacity',
            ['--drift' as any]: `${p.originX}vw`,
            ['--sway' as any]: `${p.swayAmt}vw`,
          }}
        />
      ))}

      <style>{`
        @keyframes draftFlare {
          0% { transform: translate(-10vw, -10vh) scale(0.8); opacity: 0.2; }
          50% { transform: translate(5vw, 5vh) scale(1.1); opacity: 0.5; }
          100% { transform: translate(10vw, -5vh) scale(0.9); opacity: 0.2; }
        }
        @keyframes draftSnow {
          0% { transform: translateY(-5vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          50% { transform: translateY(50vh) translateX(15px) rotate(180deg); opacity: 0.7; }
          90% { opacity: 0.9; }
          100% { transform: translateY(110vh) translateX(-15px) rotate(360deg); opacity: 0; }
        }
        @keyframes draftFireEmber {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          10% { transform: translate(calc(var(--sway) * 0.2), -5vh) scale(1.5); opacity: 1; }
          40% { transform: translate(calc(var(--drift) * 0.4 + var(--sway)), -35vh) scale(1); opacity: 0.8; }
          80% { transform: translate(calc(var(--drift) * 0.8 + var(--sway) * 0.5), -70vh) scale(0.5); opacity: 0.3; }
          100% { transform: translate(var(--drift), -100vh) scale(0); opacity: 0; }
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

/* ── Custom Styled Slider ── */
interface DraftSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

const DraftSlider: React.FC<DraftSliderProps> = ({ label, value, min, max, step = 1, unit = '', onChange }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const segments = 20;
  const filledSegments = Math.round((pct / 100) * segments);

  return (
    <div className="p-4 border-2 border-white/10 bg-black/30 group hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-gray-400 transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="bg-[#FFFF2E] text-black px-2 py-0.5 text-xs font-black tabular-nums">
            {typeof value === 'number' && step < 1 ? value.toFixed(2) : value}{unit}
          </span>
        </div>
      </div>

      {/* Segmented Visual Bar */}
      <div className="flex gap-[2px] mb-3 h-2">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 transition-all duration-100 ${i < filledSegments
              ? 'bg-[#FFFF2E]'
              : 'bg-white/10'
              }`}
          />
        ))}
      </div>

      {/* Actual Range Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="draft-slider w-full cursor-pointer"
      />

      {/* Min / Max Labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[8px] font-black uppercase text-gray-700">{min}{unit}</span>
        <span className="text-[8px] font-black uppercase text-gray-700">{max}{unit}</span>
      </div>

      <style>{`
        .draft-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: linear-gradient(to right, #FFFF2E 0%, #FFFF2E ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%);
          outline: none;
        }
        .draft-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #FFFF2E;
          border: 3px solid #000;
          cursor: pointer;
        }
        .draft-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #FFFF2E;
          border: 3px solid #000;
          border-radius: 0;
          cursor: pointer;
        }
        .draft-slider:hover::-webkit-slider-thumb {
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255,255,46,0.3);
        }
        .draft-slider:hover::-moz-range-thumb {
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255,255,46,0.3);
        }
      `}</style>
    </div>
  );
};

const tabConfig: { key: DraftTab; label: string; icon: React.ElementType }[] = [
  { key: 'fonts', label: 'შრიფტი', icon: Type },
  { key: 'colors', label: 'ფერები', icon: Palette },
  { key: 'animations', label: 'ანიმაცია', icon: Sparkles },
  { key: 'backgrounds', label: 'ფონი', icon: Image },
];

export const BookDraftView: React.FC<BookDraftViewProps> = ({ bookId, onBack }) => {
  const [activeTab, setActiveTab] = useState<DraftTab>('fonts');
  const [selectedFontId, setSelectedFontId] = useState<string>('bpg-mtavruli');
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('paper-ivory');
  const [selectedAnimationId, setSelectedAnimationId] = useState<string>('none');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>('none');

  // Layout defaults preserved for backend payload but hidden from UI
  const [baseFontSize, setBaseFontSize] = useState<number>(17);
  const [lineHeight, setLineHeight] = useState<number>(1.75);
  const [letterSpacing, setLetterSpacing] = useState<number>(0.01);
  const [contentWidth, setContentWidth] = useState<number>(740);

  // API state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load saved theme on mount
  useEffect(() => {
    let cancelled = false;
    async function loadTheme() {
      setIsLoading(true);
      try {
        const data = await api.getBookTheme(bookId);
        if (cancelled || !data) return;
        if (data.font_id && typeof data.font_id === 'string') setSelectedFontId(data.font_id);
        if (data.palette_id && typeof data.palette_id === 'string') setSelectedPaletteId(data.palette_id);
        if (data.animation_id && typeof data.animation_id === 'string') setSelectedAnimationId(data.animation_id);
        if (data.background_id && typeof data.background_id === 'string') {
          setSelectedBackgroundId(data.background_id);
        } else if (data.css_variables && (data.css_variables as any).background_id) {
          setSelectedBackgroundId((data.css_variables as any).background_id);
        }
        if (typeof data.base_font_size === 'number') setBaseFontSize(data.base_font_size);
        if (typeof data.line_height === 'number') setLineHeight(data.line_height);
        if (typeof data.letter_spacing === 'number') setLetterSpacing(data.letter_spacing);
        if (typeof data.content_width === 'number') setContentWidth(data.content_width);
      } catch {
        // Use defaults on error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadTheme();
    return () => { cancelled = true; };
  }, [bookId]);

  // Save / Publish handler
  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.saveBookTheme(bookId, {
        font_id: selectedFontId,
        palette_id: selectedPaletteId,
        animation_id: selectedAnimationId,
        background_id: selectedBackgroundId,
        base_font_size: baseFontSize,
        line_height: lineHeight,
        letter_spacing: letterSpacing,
        content_width: contentWidth,
        css_variables: { background_id: selectedBackgroundId },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'შენახვა ვერ მოხერხდა');
    } finally {
      setIsSaving(false);
    }
  }, [bookId, selectedFontId, selectedPaletteId, selectedAnimationId, selectedBackgroundId, baseFontSize, lineHeight, letterSpacing, contentWidth]);

  const selectedFont = useMemo(
    () => fontOptions.find((item) => item.id === selectedFontId) ?? fontOptions[0],
    [selectedFontId],
  );
  const selectedPalette = useMemo(
    () => paletteOptions.find((item) => item.id === selectedPaletteId) ?? paletteOptions[0],
    [selectedPaletteId],
  );
  const selectedAnimation = useMemo(
    () => animationOptions.find((item) => item.id === selectedAnimationId) ?? animationOptions[0],
    [selectedAnimationId],
  );
  const selectedBackground = useMemo(
    () => backgroundOptions.find((item) => item.id === selectedBackgroundId) ?? backgroundOptions[0],
    [selectedBackgroundId],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFFF2E]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            დრაფტ სტუდიის ჩატვირთვა...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-24 selection:bg-[#FFFF2E] selection:text-black">
      <div className="mx-auto max-w-[1800px] px-4 md:px-6 lg:px-8">
        {/* Top Navigation */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <button
            onClick={onBack}
            className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#FFFF2E] transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
            [ უკან ჩემს წიგნებზე ]
          </button>
          <div className="flex items-center gap-4">
            <span className="bg-[#FFFF2E] text-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em]">
              დრაფტ სტუდია
            </span>
            <span className="border-2 border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              წიგნი #{bookId}
            </span>
          </div>
        </header>

        {/* Main Grid: Preview + Controls */}
        <div className="flex flex-col lg:flex-row gap-6" style={{ height: '780px' }}>
          {/* ==================== PREVIEW MONITOR ==================== */}
          <section style={{ flex: '0 0 70%' }} className="min-w-0 border-4 border-white/5 bg-zinc-950 overflow-hidden flex flex-col">
            {/* Monitor Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-white/5 bg-black">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-[#FFFF2E]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  გადახედვის მონიტორი
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-gray-600" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                    სტილიზებული მკითხველი
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-500" />
                  <div className="w-2 h-2 bg-[#FFFF2E]" />
                  <div className="w-2 h-2 bg-white/20" />
                </div>
              </div>
            </div>

            {/* Preview Content — scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              {/* Shell Container */}
              <div
                className="relative border-4 border-white/10 overflow-hidden flex flex-col"
                style={{
                  backgroundColor: selectedPalette.shell,
                  backgroundImage: selectedBackground.url ? `url(${selectedBackground.url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Background Dimmer when an image is active */}
                {selectedBackground.url && (
                  <div className="absolute inset-0 bg-black/60 z-[5]" pointer-events-none="true" />
                )}

                {/* Background Animation Overlay (spans full shell window) */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                  <DraftAnimationOverlay effect={selectedAnimation.effect} accent={selectedPalette.accent} />
                </div>

                {/* Fake Browser Chrome */}
                <div className="relative z-20 flex items-center gap-3 px-4 py-3 border-b-2 border-white/10 bg-black/40">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500" />
                    <span className="w-2.5 h-2.5 bg-yellow-400" />
                    <span className="w-2.5 h-2.5 bg-green-500" />
                  </div>
                  <div className="flex-1 h-5 bg-white/5 border border-white/10 px-3 flex items-center">
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">
                      მკითხველის დრაფტის ზედაპირი
                    </span>
                  </div>
                </div>

                {/* Page Surface */}
                  <div className="relative z-10 p-4 md:p-8 flex-1">
                    <div className="mx-auto relative" style={{ maxWidth: `${contentWidth}px` }}>
                      <article
                        className="border-2 border-black/10 p-8 md:p-12 relative"
                        data-paper-effect="clean"
                        style={{
                          backgroundColor: selectedPalette.page,
                          color: selectedPalette.text,
                        fontFamily: selectedFont.family,
                        fontSize: `${baseFontSize}px`,
                        lineHeight,
                        letterSpacing: `${letterSpacing}em`,
                      }}
                    >
                      {/* Chapter Header */}
                      <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: `2px solid ${selectedPalette.accent}30` }}>
                        <span
                          className="text-[10px] font-black uppercase tracking-[0.25em]"
                          style={{ opacity: 0.6 }}
                        >
                          თავი 01 — ცოცხალი დრაფტი
                        </span>
                        <span
                          className="text-[10px] font-black uppercase tracking-[0.2em]"
                          style={{ color: selectedPalette.accent }}
                        >
                          თემის გადახედვა
                        </span>
                      </div>

                      {/* Title */}
                      <h1
                        className="font-black uppercase leading-[0.85] tracking-tighter mb-8"
                        style={{
                          color: selectedPalette.accent,
                          fontSize: `${baseFontSize * 2.4}px`,
                        }}
                      >
                        ხმის ფორმა
                      </h1>

                      {/* Body Text */}
                      <p className="mb-5">
                        პირველი გვერდი რითმს ადგენს. ეს გადახედვა ავტორს საშუალებას აძლევს შეარჩიოს ტიპოგრაფია, ფერთა პალიტრა და მოძრაობა
                        საბოლოო გამოქვეყნებამდე.
                      </p>
                      <p className="mb-5">
                        თქვენი მკითხველები მოგვიანებით ამ სტილის პროფილით მოიხმარენ წიგნს, ასე რომ ყოველი გადაწყვეტილება აქ
                        მთელი ხელნაწერის არტ-დირექციას წარმოადგენს.
                      </p>
                      <p>
                        დაარეგულირეთ სტრიქონის ნაკადი, გვერდის სიგანე და ვიზუალური ტონი, სანამ კითხვის გამოცდილება
                        მიზანმიმართული და უტყუარი არ გახდება.
                      </p>

                      {/* Footer Accent */}
                      <div className="mt-10 pt-4" style={{ borderTop: `1px solid ${selectedPalette.accent}30` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-1" style={{ backgroundColor: selectedPalette.accent }} />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ opacity: 0.4 }}>
                            გადახედვის ბლოკის დასასრული
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              {/* Monitor Stand */}
              <div className="flex flex-col items-center mt-0">
                <div className="h-4 w-40 bg-zinc-800 border-x-2 border-zinc-700" />
                <div className="h-2 w-56 bg-zinc-900 border border-zinc-800" />
              </div>
            </div>

            {/* Bottom Info Strip */}
            <div className="flex items-center justify-between px-6 py-3 border-t-2 border-white/5 bg-black/50">
              <div className="flex items-center gap-3">
                <Zap className="w-3 h-3 text-[#FFFF2E]" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  შრიფტი: {selectedFont.label}
                </span>
                <span className="text-[8px] font-black text-white/10">|</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  პალიტრა: {selectedPalette.label}
                </span>
                <span className="text-[8px] font-black text-white/10">|</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  მოძრაობა: {selectedAnimation.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-2 ${i < 6 ? 'bg-[#FFFF2E]' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          </section>

          {/* ==================== TUNING PANEL ==================== */}
          <aside style={{ flex: '0 0 calc(30% - 1.5rem)' }} className="min-w-0 border-4 border-white/5 bg-zinc-950 flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-white/5 bg-black">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-4 h-4 text-[#FFFF2E]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  პარამეტრების პანელი
                </span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                ცოცხალი კონტროლი
              </span>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-4 border-b-2 border-white/5">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 flex flex-col items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all border-b-2 -mb-[2px] ${isActive
                      ? 'bg-[#FFFF2E]/10 text-[#FFFF2E] border-[#FFFF2E]'
                      : 'text-gray-600 border-transparent hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {/* ---- FONTS TAB ---- */}
                  {activeTab === 'fonts' && (
                    <>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E] flex items-center gap-2">
                        <div className="w-6 h-[2px] bg-[#FFFF2E]" />
                        შრიფტის პროფილები
                      </h3>
                      {fontOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedFontId(option.id)}
                          className={`w-full text-left p-4 border-2 transition-all group ${selectedFontId === option.id
                            ? 'border-[#FFFF2E] bg-[#FFFF2E]/5'
                            : 'border-white/10 hover:border-[#FFFF2E]/40 hover:bg-white/5'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-[0.1em]">
                              {option.label}
                            </span>
                            {selectedFontId === option.id && (
                              <Check className="w-4 h-4 text-[#FFFF2E]" />
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mt-1 block">
                            {option.mood}
                          </span>
                        </button>
                      ))}

                      <div className="pt-4 border-t-2 border-white/5">
                        <DraftSlider
                          label="შრიფტის ზომა"
                          value={baseFontSize}
                          min={14}
                          max={24}
                          unit="px"
                          onChange={setBaseFontSize}
                        />
                      </div>
                    </>
                  )}

                  {/* ---- COLORS TAB ---- */}
                  {activeTab === 'colors' && (
                    <>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E] flex items-center gap-2">
                        <div className="w-6 h-[2px] bg-[#FFFF2E]" />
                        ფერთა სისტემები
                      </h3>
                      {paletteOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedPaletteId(option.id)}
                          className={`w-full text-left p-4 border-2 transition-all ${selectedPaletteId === option.id
                            ? 'border-[#FFFF2E] bg-[#FFFF2E]/5'
                            : 'border-white/10 hover:border-[#FFFF2E]/40 hover:bg-white/5'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black uppercase tracking-[0.1em]">
                                {option.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 border-2 border-black/30"
                                style={{ backgroundColor: option.page }}
                              />
                              <span
                                className="w-5 h-5 border-2 border-black/30"
                                style={{ backgroundColor: option.text }}
                              />
                              <span
                                className="w-5 h-5 border-2 border-black/30"
                                style={{ backgroundColor: option.accent }}
                              />
                              {selectedPaletteId === option.id && (
                                <Check className="w-4 h-4 text-[#FFFF2E] ml-1" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* ---- ANIMATIONS TAB ---- */}
                  {activeTab === 'animations' && (
                    <>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E] flex items-center gap-2">
                        <div className="w-6 h-[2px] bg-[#FFFF2E]" />
                        ანიმაციები
                      </h3>
                      {animationOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedAnimationId(option.id)}
                          className={`w-full text-left p-4 border-2 transition-all ${selectedAnimationId === option.id
                            ? 'border-[#FFFF2E] bg-[#FFFF2E]/5'
                            : 'border-white/10 hover:border-[#FFFF2E]/40 hover:bg-white/5'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-[0.1em]">
                              {option.label}
                            </span>
                            {selectedAnimationId === option.id && (
                              <Check className="w-4 h-4 text-[#FFFF2E]" />
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mt-1 block">
                            {option.note}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* ---- BACKGROUNDS TAB ---- */}
                  {activeTab === 'backgrounds' && (
                    <>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFFF2E] flex items-center gap-2 mb-6">
                        <div className="w-6 h-[2px] bg-[#FFFF2E]" />
                        ფონური გამოსახულება
                      </h3>
                      <div className="space-y-3">
                        {backgroundOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedBackgroundId(option.id)}
                            className={`w-full text-left p-4 border-2 transition-all relative overflow-hidden ${selectedBackgroundId === option.id
                              ? 'border-[#FFFF2E] bg-black/40'
                              : 'border-white/10 bg-black/30 hover:border-white/20'
                              }`}
                          >
                            {option.url && (
                              <div
                                className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
                                style={{ backgroundImage: `url(${option.url})` }}
                              />
                            )}
                            <div className="relative z-10">
                              <div className="flex justify-between items-center">
                                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${selectedBackgroundId === option.id ? 'text-[#FFFF2E]' : 'text-white'}`}>
                                  {option.label}
                                </span>
                                {selectedBackgroundId === option.id && (
                                  <Check className="w-4 h-4 text-[#FFFF2E]" />
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mt-1 block">
                                {option.note}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Panel Footer */}
            <div className="border-t-4 border-white/5 p-5 bg-black space-y-3">
              {saveError && (
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 bg-red-500/10 border border-red-500/30 p-3 text-center">
                  {saveError}
                </div>
              )}
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className={`w-full py-4 px-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed ${saveSuccess
                  ? 'bg-green-500 text-white'
                  : 'bg-[#FFFF2E] text-black hover:bg-white'
                  }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
                {isSaving ? 'ინახება...' : saveSuccess ? 'წარმატებით შეინახა!' : 'დრაფტის შენახვა'}
              </button>
            </div>
          </aside>
        </div>

        {/* Bottom Technical Strip */}
        <div className="mt-16 pt-8 border-t-2 border-white/5 opacity-20 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">
          <span>დრაფტის_ძრავა_ცოცხალი_გადახედვა_აქტიური</span>
          <span>V.2.0.0 // თემის_სინქრონიზაცია_OK</span>
        </div>
      </div>
    </div>
  );
};
