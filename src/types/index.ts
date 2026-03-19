export type PaperColor = 'white' | 'cream' | 'sepia' | 'gray' | 'dark' | 'blue' | 'green';

export interface User {
  id: string;
  email?: string;
  name?: string;
  bio?: string;
  handle?: string;
  profileImage?: string;
  profile_image?: string;
  createdAt?: string;
}

export interface Book {
  id: string | number;
  title: string;
  author: string;
  price: string;
  totalPages?: number;
  total_pages?: number;
  views?: string | number;
  followers?: string | number;
  revenue?: string | number;
  oldPrice?: string;
  category?: string;
  tag?: string;
  img?: string;
  coverUrl?: string;
  cover_image_url?: string;
  description?: string;
  pages?: string[];
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  extraction_status?: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  extraction_error?: string | null;
  is_readable?: boolean;
  purchase_count?: number;
}

export interface Review {
  id: string | number;
  user: string;
  userHandle?: string;
  avatar?: string;
  bookTitle: string;
  bookId?: string | number;
  rating: number;
  content: string;
  date: string;
  book?: string | number;
  upvotes?: number;
  downvotes?: number;
  netScore?: number;
  userVote?: 1 | -1 | null;
}

export interface CommunityPost {
  id: string | number;
  author: string;
  handle: string;
  avatar?: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  recent_comments?: CommunityPostComment[];
  category: string;
  is_saved?: boolean;
  is_liked?: boolean;
}

export interface CommunityPostComment {
  id: string | number;
  author: string;
  handle: string;
  avatar?: string;
  content: string;
  createdAt: string;
  parent?: string | number | null;
}

export interface Order {
  id: string | number;
  bookTitle: string;
  price: string;
  img?: string;
  status?: string;
  timestamp: string;
}

export interface MyBook {
  id: string | number;
  title: string;
  author?: string;
  price: string;
  coverUrl?: string;
  cover_image_url?: string;
  description?: string;
  category?: string;
  status?: 'published';
  view_count?: number;
  views?: number;
  follower_count?: number;
  followers?: number;
  owners_count?: number;
  owners?: number;
  revenue?: string;
  extraction_status?: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  extraction_error?: string | null;
  is_readable?: boolean;
  total_pages?: number;
}

export interface WalletStats {
  balance: string;
  totalMade: string;
  pending: string;
  withdrawals: string;
}

export interface WalletTransaction {
  id: string | number;
  type: 'SALE' | 'DEPOSIT' | 'WITHDRAW';
  amount: string;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  label: string;
}

export interface UploadBookPayload {
  title: string;
  author: string;
  description: string;
  price: string;
  category: string;
}

export interface UploadBookFiles {
  cover?: File | null;
  pdf?: File | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Publish operation types

export type PublishStatus = 'idle' | 'publishing' | 'published' | 'error';

export interface PublishError {
  type: 'conflict' | 'validation' | 'server' | 'PARITY_MISMATCH';
  message: string;
  detail?: string;
  mismatches?: Array<{
    block_id: string;
    block_type: string;
    page_number: number;
    issue_type: 'heading' | 'alignment' | 'spacing';
    message: string;
    severity: string;
  }>;
}

export interface PublishResult {
  success: boolean;
  bookId: string | number;
  pagesPublished?: number;
  error?: PublishError;
}

// Audit log types for book lifecycle tracking (SECG-02)

export type AuditAction = 'upload' | 'edit' | 'publish';

export interface AuditLogEntry {
  id: number;
  bookId: number;
  userId: number;
  userEmail: string;
  action: AuditAction;
  timestamp: string;
  details: {
    pageNumber?: number;
    attempt?: number;
    pageCount?: number;
    version?: number;
  };
  ipAddress?: string;
}

export interface AuditLogFilters {
  action?: AuditAction;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogResponse {
  count: number;
  book_id: number;
  filters: {
    action: string | null;
    user_id: number | null;
    start_date: string | null;
    end_date: string | null;
  };
  results: AuditLogEntry[];
}

export type ReaderAccessMode = 'full' | 'preview' | 'processing' | 'denied';

export interface ReaderManifest {
  book_id: string | number;
  title?: string;
  author?: string;
  price?: string;
  status: 'ready' | 'processing';
  extraction_status?: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  total_pages: number;
  available_pages?: number;
  preview_limit: number;
  access_mode: ReaderAccessMode;
  is_readable: boolean;
  page_frame_width?: number;
  page_frame_height?: number;
}

export interface ReaderPageResponse {
  book_id: string | number;
  page_number: number;
  render_mode: 'html' | 'image';
  render_html?: string;
  fallback_image_data?: string | null;
  blocks?: unknown[];
  version?: number;
  page_width?: number | null;
  page_height?: number | null;
}

