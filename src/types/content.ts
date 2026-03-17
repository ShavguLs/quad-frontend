// Content block types aligned with backend ContentBlock dataclasses
// See: api/apps/books/models/content_blocks.py

/** Types of content blocks */
export type BlockType = 'paragraph' | 'heading' | 'list_item' | 'image' | 'page_break';

/** Position information for a block (matches BlockPosition dataclass) */
export interface BlockPosition {
  start: number;        // Character offset in page content
  end: number;
  page_x?: number;      // Original PDF coordinates
  page_y?: number;
}

/** Formatting metadata for text blocks (matches BlockFormatting dataclass) */
export interface BlockFormatting {
  bold?: boolean;
  italic?: boolean;
  font_size?: number;
  font_family?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  line_height?: number;
  color?: string;       // CSS color
}

/** Metadata about block origin and quality (matches BlockMetadata dataclass) */
export interface BlockMetadata {
  source?: 'extraction' | 'manual' | 'import';
  confidence?: number;  // Extraction confidence (0-1)
  created_at?: string;  // ISO timestamp
  modified_at?: string;
}

/** Mark for inline formatting (bold, italic, color, etc.) */
export interface TextMark {
  type: 'bold' | 'italic' | 'underline' | 'textStyle' | 'strike' | string;
  attrs?: Record<string, unknown>;
}

/** Base content block structure (matches ContentBlock dataclass) */
export interface ContentBlock {
  id?: string;          // Unique block identifier
  type: BlockType;
  text?: string;        // Text content (for paragraph, heading, list_item)
  content?: string;     // Alias for text (frontend convenience)
  position?: BlockPosition;
  metadata?: BlockMetadata;
  formatting?: BlockFormatting;
  attrs?: {
    level?: number;           // heading level (1-6)
    src?: string;             // image source
    alt?: string;             // image alt text
    image_id?: string;        // Reference to extracted image asset
    xref?: number;            // Original PDF xref
    caption?: string;         // Image caption
    width?: number;           // Image dimensions
    height?: number;
    list_type?: 'ordered' | 'unordered';
    list_index?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontFamily?: string;
    color?: string;
    [key: string]: unknown;
  };
  marks?: TextMark[];
}

/** BookContent - matches BookContent model from backend */
export interface BookContent {
  id: number;
  book_id: number;
  blocks: ContentBlock[];
  version: number;
  extracted_at: string;
  last_modified: string;
  metadata?: {
    total_blocks?: number;
    word_count?: number;
    image_count?: number;
    [key: string]: unknown;
  };
}

/** ContentVersion - matches ContentVersion model from backend */
export interface ContentVersion {
  id: number;
  book_content_id: number;
  version_number: number;
  blocks_snapshot: ContentBlock[];
  version_type: 'auto' | 'manual' | 'publish' | 'revert';
  created_by?: number;
  created_by_email?: string;
  created_at: string;
  change_summary?: string;
  blocks_changed?: string[];
}

/** API response types (snake_case from backend) */
export interface BookContentResponse {
  id: number;
  book_id: number;
  blocks: ContentBlock[];
  version: number;
  extracted_at: string;
  last_modified: string;
  metadata?: BookContent['metadata'];
}

/** Conflict error from optimistic locking */
export interface ContentConflictError {
  type: 'conflict';
  detail?: string;
  server_version: number;
  client_version: number;
  server_content: ContentBlock[];
  last_modified: string | null;
}

/** Paragraph block convenience type */
export interface ParagraphBlock extends ContentBlock {
  type: 'paragraph';
  text: string;
}

/** Heading block convenience type */
export interface HeadingBlock extends ContentBlock {
  type: 'heading';
  text: string;
  attrs: {
    level: number;
  };
}

/** List item block convenience type */
export interface ListItemBlock extends ContentBlock {
  type: 'list_item';
  text: string;
  attrs: {
    list_type: 'ordered' | 'unordered';
    list_index?: number;
  };
}

/** Image block convenience type */
export interface ImageBlock extends ContentBlock {
  type: 'image';
  attrs: {
    src?: string;
    alt?: string;
    image_id?: string;
    xref?: number;
    caption?: string;
    width?: number;
    height?: number;
  };
}

/** Page break block convenience type */
export interface PageBreakBlock extends ContentBlock {
  type: 'page_break';
}
