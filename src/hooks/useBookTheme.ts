// useBookTheme hook - Convenience hook for accessing book theme
// Re-exports from BookThemeContext with additional selector hooks

export { useBookTheme, useBookTheme as default } from '../contexts/BookThemeContext';

import { useBookTheme } from '../contexts/BookThemeContext';
import { getPaperBackground, getFontStack, PAPER_BACKGROUNDS, FONT_OPTIONS } from '../types/bookTheme';
import type { PaperBackground, FontFamily, PaperBackgroundMetadata, FontFamilyMetadata } from '../types/bookTheme';

/**
 * Hook to get current paper background metadata
 * @returns Full metadata for the current paper background including label, color, textColor
 */
export function usePaperBackground(): PaperBackgroundMetadata & { value: PaperBackground } {
  const { theme } = useBookTheme();
  const metadata = getPaperBackground(theme.paperBackground);

  return {
    value: theme.paperBackground,
    ...metadata,
  };
}

/**
 * Hook to get current font family metadata
 * @returns Full metadata for the current font family including label and CSS stack
 */
export function useFontFamily(): FontFamilyMetadata & { value: FontFamily } {
  const { theme } = useBookTheme();
  const stack = getFontStack(theme.fontFamily);
  const fontOption = FONT_OPTIONS.find(f => f.value === theme.fontFamily);

  return {
    value: theme.fontFamily,
    label: fontOption?.label || 'მთავრული',
    stack,
  };
}

/**
 * Hook to get all available theme options
 * @returns Object with all paper backgrounds and font options
 */
export function useThemeOptions(): {
  paperBackgrounds: Array<{ value: PaperBackground } & PaperBackgroundMetadata>;
  fontOptions: FontFamilyMetadata[];
} {
  return {
    paperBackgrounds: Object.entries(PAPER_BACKGROUNDS).map(([value, metadata]) => ({
      value: value as PaperBackground,
      ...metadata,
    })),
    fontOptions: FONT_OPTIONS,
  };
}

/**
 * Hook to check if theme can be changed (not loading and no error)
 * @returns boolean indicating if theme interactions should be enabled
 */
export function useCanChangeTheme(): boolean {
  const { isLoading, error } = useBookTheme();
  return !isLoading && !error;
}
