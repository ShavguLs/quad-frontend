const READER_BASE_URL = (import.meta.env.VITE_READER_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://reader.quaduni.com';

export const getReaderUrl = (bookId: string | number, preview = false): string => {
  const suffix = preview ? '?preview=1' : '';
  return `${READER_BASE_URL}/${bookId}${suffix}`;
};

export const openReader = (bookId: string | number, preview = false): void => {
  window.location.assign(getReaderUrl(bookId, preview));
};
