/**
 * Parses a book route parameter to extract the numeric book ID.
 * 
 * Supports both legacy numeric IDs and new slug-based routes:
 * - "14" → "14"
 * - "შოთა-რუსთაველი-ვეფხისტყაოსანი--14" → "14"
 * - "wrong-slug--14" → "14"
 * - "only-slug" → null
 * - "" → null
 * - undefined → null
 * 
 * @param bookPath - The book route parameter from the URL
 * @returns The numeric book ID as a string, or null if not found
 */
export const parseBookRouteId = (bookPath?: string): string | null => {
  if (!bookPath) {
    return null;
  }

  const trimmedPath = bookPath.trim();
  if (/^\d+$/.test(trimmedPath)) {
    return trimmedPath;
  }

  const slugMatch = trimmedPath.match(/--(\d+)$/);
  return slugMatch?.[1] ?? null;
};
