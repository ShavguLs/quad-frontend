// HTML Sanitizer Service
// Uses DOMPurify to sanitize book content before rendering
// Configured for safe HTML with book-specific formatting support

import DOMPurify from 'dompurify';

const ALLOWED_STYLE_PROPERTIES = new Set([
  'text-align',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'letter-spacing',
  'word-spacing',
  'text-indent',
  'color',
  'background-color',
  'display',
  'width',
  'height',
  'max-width',
  'min-width',
  'max-height',
  'min-height',
]);

const CSS_DANGEROUS_PATTERN = /(url\s*\(|expression\s*\(|@import|javascript:|vbscript:|data:)/i;
const SAFE_STYLE_VALUE_PATTERN = /^[a-zA-Z0-9\s#(),.%+\-/'"]+$/;

let sanitizerHooksRegistered = false;

const sanitizeInlineStyle = (rawStyle: string): string => {
  const declarations = rawStyle
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  const sanitized: string[] = [];
  for (const declaration of declarations) {
    const separatorIndex = declaration.indexOf(':');
    if (separatorIndex === -1) continue;

    const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
    const value = declaration.slice(separatorIndex + 1).trim();

    if (!ALLOWED_STYLE_PROPERTIES.has(property)) continue;
    if (!value) continue;
    if (CSS_DANGEROUS_PATTERN.test(value)) continue;
    if (!SAFE_STYLE_VALUE_PATTERN.test(value)) continue;

    if (property === 'text-align' && !/^(left|right|center|justify)$/i.test(value)) {
      continue;
    }

    sanitized.push(`${property}:${value}`);
  }

  return sanitized.join(';');
};

const ensureSanitizerHooks = () => {
  if (sanitizerHooksRegistered) {
    return;
  }

  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') {
      return;
    }

    const next = sanitizeInlineStyle(data.attrValue || '');
    if (!next) {
      data.keepAttr = false;
      return;
    }
    data.attrValue = next;
  });

  sanitizerHooksRegistered = true;
};

/**
 * DOMPurify configuration for book content
 * Allows common book formatting tags while blocking scripts and dangerous attributes
 */
export const bookSanitizerConfig = {
  ALLOWED_TAGS: [
    // Block elements
    'p', 'br', 'hr',
    // Inline formatting
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Other blocks
    'blockquote', 'pre', 'code',
    // Links and media
    'a', 'img',
    // Superscript/subscript
    'sup', 'sub',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Figures
    'figure', 'figcaption',
  ],
  ALLOWED_ATTR: [
    // Common attributes
    'class', 'id', 'style',
    // Links
    'href', 'target',
    // Images
    'src', 'alt', 'title', 'width', 'height',
    // Data attributes for tracking
    'data-block-id',
    'data-heading-level',
    'data-block-type',
  ],
  FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onmouseout'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitize HTML content for book rendering
 * @param dirty - Raw HTML string that may contain unsafe content
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeBookHTML(dirty: string): string {
  ensureSanitizerHooks();
  return DOMPurify.sanitize(dirty, bookSanitizerConfig);
}

/**
 * Check if a string contains potentially dangerous HTML
 * Useful for validation before saving user-generated content
 * @param html - HTML string to check
 * @returns True if the content would be modified by sanitization
 */
export function containsDangerousHTML(html: string): boolean {
  const sanitized = sanitizeBookHTML(html);
  return sanitized !== html;
}
