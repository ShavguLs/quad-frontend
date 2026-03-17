// BookThemeWrapper - Component that applies theme CSS variables to children
// Uses CSS Custom Properties via inline style for instant theme switching

import React from 'react';
import { useBookTheme } from '../hooks/useBookTheme';
import { getPaperBackground, getFontStack } from '../types/bookTheme';
import type { BookTheme } from '../types/bookTheme';
import '../styles/book-themes.css';

/** Props for BookThemeWrapper */
interface BookThemeWrapperProps {
  /** Child elements to be themed */
  children: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Optional variant for specific use cases */
  variant?: 'editor' | 'default';
  /** Optional theme override (defaults to context theme) */
  theme?: BookTheme;
}

/**
 * BookThemeWrapper - Applies CSS Custom Properties and paper classes to children
 *
 * Pattern: Scoped CSS Custom Properties via inline style for instant switching
 * Combines:
 * 1. CSS class for static paper background styles (from book-themes.css)
 * 2. Inline style with CSS Custom Properties for dynamic theming
 * 3. Both combine to create the full theme effect
 *
 * Usage:
 * ```tsx
 * <BookThemeProvider bookId="123">
 *   <BookThemeWrapper>
 *     <BookContent />
 *   </BookThemeWrapper>
 * </BookThemeProvider>
 * ```
 */
export function BookThemeWrapper({
  children,
  className = '',
  variant = 'default',
  theme: themeProp,
}: BookThemeWrapperProps): React.ReactElement {
  const { theme: contextTheme } = useBookTheme();
  const theme = themeProp || contextTheme;

  // Get metadata for current theme
  const paper = getPaperBackground(theme.paperBackground);
  const fontStack = getFontStack(theme.fontFamily);

  // Build CSS class names
  const paperClass = `book-paper-${theme.paperBackground}`;
  const wrapperClass = 'book-theme-wrapper';
  const variantClass = variant !== 'default' ? `book-${variant}-paper` : '';

  // Combine all classes
  const combinedClassName = [wrapperClass, paperClass, variantClass, className]
    .filter(Boolean)
    .join(' ');

  // CSS Custom Properties for dynamic theming
  const cssVariables: React.CSSProperties = {
    '--book-bg-color': paper.color,
    '--book-text-color': paper.textColor,
    '--book-font-family': fontStack,
  } as React.CSSProperties;

  return (
    <div
      className={combinedClassName}
      style={cssVariables}
    >
      {children}
    </div>
  );
}

/** Convenience wrapper for editor view */
export function EditorThemeWrapper({
  children,
  className = '',
}: Omit<BookThemeWrapperProps, 'variant'>): React.ReactElement {
  return (
    <BookThemeWrapper variant="editor" className={className}>
      {children}
    </BookThemeWrapper>
  );
}

export default BookThemeWrapper;
