/**
 * Audit log types for book lifecycle action tracking
 * 
 * SECG-02: Audit trail for upload, edit, and publish actions
 */

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
