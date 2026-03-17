/**
 * Chapter type definitions
 * 
 * Used for chapter management in the book editor sidebar.
 * Backend model has: id, book (FK), title, position, created_at, updated_at
 */

export interface Chapter {
  id: string | number;
  book: string | number;
  title: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReorderChaptersPayload {
  chapter_ids: (string | number)[];
}

export interface CreateChapterPayload {
  title: string;
}
