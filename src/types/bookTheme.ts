// Book Theme Types and Constants
// Defines paper backgrounds, font families, and theme configuration

/** Available paper background types */
export type PaperBackground = 'parchment' | 'white' | 'dark' | 'sepia';

/** Available font family types */
export type FontFamily = 'serif' | 'sans' | 'mtavruli';

/** Complete book theme configuration */
export interface BookTheme {
  paperBackground: PaperBackground;
  fontFamily: FontFamily;
}

/** Metadata for each paper background option */
export interface PaperBackgroundMetadata {
  label: string;
  color: string;
  textColor: string;
}

/** Metadata for each font family option */
export interface FontFamilyMetadata {
  value: FontFamily;
  label: string;
  stack: string;
}

/** Default theme configuration */
export const DEFAULT_THEME: BookTheme = {
  paperBackground: 'white',
  fontFamily: 'mtavruli',
};

/** Paper background options with Georgian labels */
export const PAPER_BACKGROUNDS: Record<PaperBackground, PaperBackgroundMetadata> = {
  parchment: {
    label: 'პარქმენტი',
    color: '#f5e6c8',
    textColor: '#4a3c28',
  },
  white: {
    label: 'თეთრი',
    color: '#ffffff',
    textColor: '#1a1a1a',
  },
  dark: {
    label: 'მუქი',
    color: '#1a1a2e',
    textColor: '#e0e0e0',
  },
  sepia: {
    label: 'სეპია',
    color: '#f4ecd8',
    textColor: '#5c4b37',
  },
};

/** Font family options with Georgian labels */
export const FONT_OPTIONS: FontFamilyMetadata[] = [
  {
    value: 'serif',
    label: 'სერიფი',
    stack: 'Georgia, "Times New Roman", serif',
  },
  {
    value: 'sans',
    label: 'უსერიფო',
    stack: 'system-ui, -apple-system, sans-serif',
  },
  {
    value: 'mtavruli',
    label: 'მთავრული',
    stack: '"BPG Extrasquare Mtavruli", sans-serif',
  },
];

/**
 * Get metadata for a specific paper background
 * @param paper - The paper background type
 * @returns Metadata including label, color, and text color
 */
export function getPaperBackground(paper: PaperBackground): PaperBackgroundMetadata {
  return PAPER_BACKGROUNDS[paper];
}

/**
 * Get the CSS font stack for a specific font family
 * @param font - The font family type
 * @returns CSS font stack string
 */
export function getFontStack(font: FontFamily): string {
  const fontOption = FONT_OPTIONS.find(f => f.value === font);
  return fontOption?.stack || FONT_OPTIONS[2].stack; // Default to mtavruli
}

/**
 * Convert a theme to CSS custom properties object
 * @param theme - The book theme configuration
 * @returns Object with CSS variable names as keys
 */
export function themeToCSSVars(theme: BookTheme): {
  '--book-bg-color': string;
  '--book-text-color': string;
  '--book-font-family': string;
} {
  const paper = getPaperBackground(theme.paperBackground);
  const fontStack = getFontStack(theme.fontFamily);

  return {
    '--book-bg-color': paper.color,
    '--book-text-color': paper.textColor,
    '--book-font-family': fontStack,
  };
}

/**
 * Get the CSS class name for a paper background
 * @param paper - The paper background type
 * @returns CSS class name (e.g., 'book-paper-parchment')
 */
export function getPaperClassName(paper: PaperBackground): string {
  return `book-paper-${paper}`;
}

/**
 * Get all available paper background options as array
 * @returns Array of paper background entries with metadata
 */
export function getAllPaperBackgrounds(): Array<{ value: PaperBackground } & PaperBackgroundMetadata> {
  return (Object.entries(PAPER_BACKGROUNDS) as Array<[PaperBackground, PaperBackgroundMetadata]>).map(
    ([value, metadata]) => ({ value, ...metadata })
  );
}

/**
 * Get all available font family options
 * @returns Array of font family metadata
 */
export function getAllFontOptions(): FontFamilyMetadata[] {
  return FONT_OPTIONS;
}
