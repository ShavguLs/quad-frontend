import React from 'react';
import { useBookTheme } from '../hooks/useBookTheme';
import {
  PAPER_BACKGROUNDS,
  FONT_OPTIONS,
  PaperBackground,
  FontFamily,
} from '../types/bookTheme';
import { Loader2 } from 'lucide-react';

interface ThemeSelectorProps {
  /** Show paper background options (default: true) */
  showPaperBackgrounds?: boolean;
  /** Show font family options (default: true) */
  showFonts?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * ThemeSelector - UI for selecting book paper backgrounds and fonts
 *
 * Georgian labels:
 * - Papers: პარქმენტი, თეთრი, მუქი, სეპია
 * - Fonts: სერიფი, უსერიფო, მთავრული
 *
 * Uses useBookTheme() hook for state management and persistence
 */
export function ThemeSelector({
  showPaperBackgrounds = true,
  showFonts = true,
  className = '',
}: ThemeSelectorProps): React.ReactElement {
  const { pendingTheme, setPendingTheme, isLoading } = useBookTheme();
  const displayTheme = pendingTheme;

  // Get paper backgrounds as array
  const paperOptions = Object.entries(PAPER_BACKGROUNDS).map(
    ([key, metadata]) => ({
      value: key as PaperBackground,
      ...metadata,
    })
  );

  // Handle paper background selection
  const handlePaperSelect = (paper: PaperBackground) => {
    setPendingTheme({ paperBackground: paper });
  };

  // Handle font family selection
  const handleFontSelect = (font: FontFamily) => {
    setPendingTheme({ fontFamily: font });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#FFFF2E]" />
          <span className="ml-2 text-xs text-gray-400">იტვირთება...</span>
        </div>
      )}

      {/* Paper Backgrounds Section */}
      {showPaperBackgrounds && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            ფონის ფერი
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {paperOptions.map((paper) => (
              <button
                key={paper.value}
                onClick={() => handlePaperSelect(paper.value)}
                disabled={isLoading}
                className={`
                  relative p-3 rounded border-2 transition-all duration-200
                  ${
                    displayTheme.paperBackground === paper.value
                      ? 'border-[#FFFF2E] ring-1 ring-[#FFFF2E]'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ backgroundColor: paper.color }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: paper.textColor }}
                >
                  {paper.label}
                </span>
                {displayTheme.paperBackground === paper.value && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-[#FFFF2E] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Family Section */}
      {showFonts && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            შრიფტი
          </h3>
          <div className="flex flex-col gap-1">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                onClick={() => handleFontSelect(font.value)}
                disabled={isLoading}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded text-left transition-all duration-200
                  ${
                    displayTheme.fontFamily === font.value
                      ? 'bg-[#FFFF2E] text-black'
                      : 'bg-zinc-900 text-gray-300 hover:bg-zinc-800 hover:text-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Font sample */}
                <span
                  className="text-lg font-medium w-8 text-center"
                  style={{ fontFamily: font.stack }}
                >
                  აბ
                </span>
                {/* Font label */}
                <span className="text-sm font-medium">{font.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;
