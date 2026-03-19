import type {
  Book,
  User,
  Review,
  CommunityPost,
  CommunityPostComment,
  Order,
  MyBook,
  WalletStats,
  WalletTransaction,
  UploadBookPayload,
  UploadBookFiles,
  PaginatedResponse,
  PublishResult,
  PublishError,
  AuditLogResponse,
  AuditLogFilters,
  ReaderManifest,
  ReaderPageResponse,
} from '../types';
import { refreshAccessToken, logout } from './auth';

// In-memory CSRF token store for cross-origin local dev (localhost -> api.quaduni.com)
let inMemoryCsrfToken: string | null = null;

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Ensures we have a valid CSRF token for unsafe HTTP methods.
 * Priority:
 *   1. In-memory token (if available)
 *   2. Cookie read (for same-origin cases)
 *   3. Fetch from /auth/csrf endpoint (for cross-origin local dev)
 */
export const ensureCsrfToken = async (): Promise<string | null> => {
  // 1. Use in-memory token if available
  if (inMemoryCsrfToken) {
    return inMemoryCsrfToken;
  }

  // 2. Try reading from cookie (works for same-origin)
  const cookieToken = getCookieValue('csrftoken');
  if (cookieToken) {
    inMemoryCsrfToken = cookieToken;
    return cookieToken;
  }

  // 3. Fetch from backend (for cross-origin local dev)
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://api.quaduni.com';
  try {
    const response = await fetch(`${apiBaseUrl}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json() as { csrfToken?: string };
      if (data.csrfToken) {
        inMemoryCsrfToken = data.csrfToken;
        return data.csrfToken;
      }
    }
  } catch {
    // Failed to fetch CSRF token - will proceed without it
  }

  return null;
};

/**
 * Sets the in-memory CSRF token. Call this after successful auth actions.
 */
export const setCsrfToken = (token: string | null): void => {
  inMemoryCsrfToken = token;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://api.quaduni.com';
const initialHasApi = Boolean(API_BASE_URL);
let hasApi = initialHasApi;

export const __setHasApiForTesting = (value: boolean) => {
  hasApi = value;
};

export const __resetHasApiForTesting = () => {
  hasApi = initialHasApi;
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

const shouldAttachCsrfToken = (method?: string): boolean => {
  if (!method) return false;
  return !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());
};

/**
 * Clears the in-memory CSRF token (e.g., on logout)
 */
export const clearCsrfToken = (): void => {
  inMemoryCsrfToken = null;
};

const fetchWithRefresh = async (url: string, options: RequestOptions = {}): Promise<Response> => {
  const { skipAuth, ...fetchOptions } = options;
  const requestOptions: RequestInit = {
    ...fetchOptions,
    credentials: 'include',
  };

  let response = await fetch(`${API_BASE_URL}${url}`, requestOptions);

  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${url}`, requestOptions);
    } else {
      await logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return response;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error('BACKEND_NOT_CONFIGURED');
  }

  const isFormData = options.body instanceof FormData;
  const baseHeaders = new Headers(options.headers || undefined);

  if (!isFormData && !baseHeaders.has('Content-Type')) {
    baseHeaders.set('Content-Type', 'application/json');
  }

  // Ensure CSRF token is attached for unsafe methods
  if (shouldAttachCsrfToken(options.method) && !baseHeaders.has('X-CSRFToken')) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      baseHeaders.set('X-CSRFToken', csrfToken);
    }
  }

  const response = await fetchWithRefresh(path, {
    ...options,
    headers: baseHeaders,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const errorBody = contentType && contentType.includes('application/json') ? await response.json() : await response.text();
    const message = typeof errorBody === 'string' ? errorBody : errorBody?.error || errorBody?.message || errorBody?.detail || 'REQUEST_FAILED';
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

export const api = {
  async getBooks(): Promise<Book[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Book>>('/books/', { skipAuth: true });
    return response.results || [];
  },

  async getFeaturedBooks(): Promise<Book[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Book>>('/books/featured/', { skipAuth: true });
    return response.results || [];
  },

  async getReviews(): Promise<Review[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Review>>('/reviews/');
    return response.results || [];
  },

  async getBookReviews(bookId: string | number): Promise<Review[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Review>>(`/reviews/?book=${bookId}`);
    return response.results || [];
  },

  async getCommunityPosts(page: number = 1, pageSize: number = 20): Promise<{ results: CommunityPost[]; count: number; next: string | null; previous: string | null }> {
    if (!hasApi) return { results: [], count: 0, next: null, previous: null };
    const response = await request<PaginatedResponse<CommunityPost>>(`/community/posts/?page=${page}&page_size=${pageSize}`);
    return {
      results: response.results || [],
      count: response.count || 0,
      next: response.next || null,
      previous: response.previous || null,
    };
  },

  async createCommunityPost(payload: { content: string; category?: string; image_url?: string }): Promise<CommunityPost> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<CommunityPost>('/community/posts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPostComments(postId: string | number, page: number = 1, pageSize: number = 20): Promise<{ results: CommunityPostComment[]; count: number; next: string | null; previous: string | null }> {
    if (!hasApi) return { results: [], count: 0, next: null, previous: null };
    const response = await request<PaginatedResponse<CommunityPostComment>>(`/community/posts/${postId}/comments/?page=${page}&page_size=${pageSize}`);
    return {
      results: response.results || [],
      count: response.count || 0,
      next: response.next || null,
      previous: response.previous || null,
    };
  },

  async createPostComment(postId: string | number, content: string, parent?: string | number | null): Promise<CommunityPostComment> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<CommunityPostComment>(`/community/posts/${postId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content, parent: parent || null }),
    });
  },

  async deleteCommunityPost(postId: string | number): Promise<void> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/community/posts/${postId}/`, { method: 'DELETE' });
  },

  async saveCommunityPost(postId: string | number): Promise<{ status: string }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/community/posts/${postId}/save_post/`, { method: 'POST' });
  },

  async unsaveCommunityPost(postId: string | number): Promise<void> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/community/posts/${postId}/unsave_post/`, { method: 'DELETE' });
  },

  async getSavedCommunityPosts(): Promise<CommunityPost[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<CommunityPost>>('/community/posts/saved/?page_size=200');
    return response.results || [];
  },

  async likeCommunityPost(postId: string | number): Promise<{ status: string, likes: number }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/community/posts/${postId}/like_post/`, { method: 'POST' });
  },

  async unlikeCommunityPost(postId: string | number): Promise<{ status: string, likes: number }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/community/posts/${postId}/unlike_post/`, { method: 'DELETE' });
  },

  async getOrders(): Promise<Order[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Order>>('/orders/');
    return response.results || [];
  },

  async updateProfile(payload: { name?: string; bio?: string; profileImage?: File | null }): Promise<User> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');

    const hasFile = Boolean(payload.profileImage);
    let body: BodyInit | undefined;

    if (hasFile) {
      const formData = new FormData();
      if (payload.name !== undefined) formData.append('name', payload.name);
      if (payload.bio !== undefined) formData.append('bio', payload.bio);
      if (payload.profileImage) formData.append('profile_image', payload.profileImage);
      body = formData;
    } else {
      const data: Record<string, unknown> = {};
      if (payload.name !== undefined) data.name = payload.name;
      if (payload.bio !== undefined) data.bio = payload.bio;
      body = JSON.stringify(data);
    }

    const response = await request<User | { user?: User } | null>('/profile', {
      method: 'PATCH',
      body,
    });

    const typedResponse = (response as { user?: User }) ?? null;
    const baseResponse = (response as User) ?? null;
    const user = typedResponse?.user ?? baseResponse;
    if (!user) throw new Error('PROFILE_UPDATE_FAILED');

    const profileImage = user.profileImage || user.profile_image;
    if (profileImage) {
      return { ...user, profileImage, profile_image: profileImage };
    }
    return user;
  },

  async getLibrary(): Promise<Book[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Book>>('/library/me/');
    return response.results || [];
  },

  async getMyBooks(): Promise<MyBook[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<MyBook>>('/me/books/');
    return (response.results || []).map((book) => ({
      ...book,
      views: typeof book.views === 'number'
        ? book.views
        : typeof book.view_count === 'number'
          ? book.view_count
          : 0,
      owners: typeof book.owners === 'number'
        ? book.owners
        : typeof book.owners_count === 'number'
          ? book.owners_count
          : typeof book.followers === 'number'
            ? book.followers
            : typeof book.follower_count === 'number'
              ? book.follower_count
              : 0,
    }));
  },

  async getWalletStats(): Promise<WalletStats | null> {
    if (!hasApi) return null;
    return request<WalletStats>('/wallet/stats/');
  },

  async getWalletTransactions(): Promise<WalletTransaction[]> {
    if (!hasApi) return [];
    return request<WalletTransaction[]>('/wallet/transactions/');
  },

  async deposit(amount: number): Promise<{ message: string; amount: string; new_balance: string }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request('/wallet/deposit/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async createOrder(payload: { bookId: Book['id'] }): Promise<Order> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Order>('/orders/', {
      method: 'POST',
      body: JSON.stringify({ book: payload.bookId }),
    });
  },

  async uploadBook(payload: UploadBookPayload, files: UploadBookFiles): Promise<Book> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    if (!files.pdf) throw new Error('PDF file is required.');

    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('author', payload.author);
    formData.append('description', payload.description);
    formData.append('price', payload.price);
    formData.append('category', payload.category);
    formData.append('status', 'draft');

    if (files.cover) formData.append('cover_image', files.cover);

    const createdBook = await request<Book>('/books/', {
      method: 'POST',
      body: formData,
    });

    const uploadFormData = new FormData();
    uploadFormData.append('file', files.pdf);

    try {
      await request<{ extraction_status: string }>(`/books/${createdBook.id}/upload/`, {
        method: 'POST',
        body: uploadFormData,
      });
    } catch (err) {
      try {
        await request(`/books/${createdBook.id}/`, { method: 'DELETE' });
      } catch {
        // Cleanup is best-effort; the orphaned book will have no content and remain hidden.
      }
      throw err;
    }

    return createdBook;
  },

  async updateBook(bookId: string | number, payload: Partial<UploadBookPayload>, files?: Partial<UploadBookFiles>): Promise<void> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');

    const formData = new FormData();
    if (payload.title) formData.append('title', payload.title);
    if (payload.author) formData.append('author', payload.author);
    if (payload.description) formData.append('description', payload.description);
    if (payload.price) formData.append('price', payload.price);
    if (payload.category) formData.append('category', payload.category);

    if (files?.cover) formData.append('cover_image', files.cover);
    if (files?.pdf) formData.append('pdf', files.pdf);

    await request(`/books/${bookId}/`, {
      method: 'PATCH',
      body: formData,
    });
  },

  async deleteBook(bookId: string | number): Promise<void> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    await request(`/books/${bookId}/`, { method: 'DELETE' });
  },

  async retryBookExtraction(bookId: string | number): Promise<{ extraction_status: string; status: string }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/books/${bookId}/retry-extraction/`, {
      method: 'POST',
    });
  },

  async getReaderManifest(bookId: string | number): Promise<ReaderManifest> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<ReaderManifest>(`/books/${bookId}/read/manifest/`);
  },

  async getReaderPage(bookId: string | number, pageNumber: number): Promise<ReaderPageResponse> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<ReaderPageResponse>(`/books/${bookId}/read/pages/${pageNumber}/`);
  },

  async createReview(payload: { book: Book['id']; rating: number; content: string }): Promise<Review> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Review>('/reviews/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateReview(reviewId: string | number, payload: { rating?: number; content?: string }): Promise<Review> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Review>(`/reviews/${reviewId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteReview(reviewId: string | number): Promise<void> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    await request(`/reviews/${reviewId}/`, { method: 'DELETE' });
  },

  async voteOnReview(reviewId: string | number, voteType: 1 | -1): Promise<{
    message: string;
    vote_type: number;
    upvotes: number;
    downvotes: number;
  }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/reviews/${reviewId}/vote/`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  },

  async removeVote(reviewId: string | number): Promise<{
    message: string;
    upvotes: number;
    downvotes: number;
  }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/reviews/${reviewId}/remove_vote/`, { method: 'DELETE' });
  },

  async publishBook(bookId: string | number): Promise<PublishResult> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');

    try {
      const response = await fetchWithRefresh(`/books/${bookId}/publish/`, {
        method: 'POST',
      });

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        const error: PublishError = {
          type: 'conflict',
          message: errorData.detail || 'Content changed during publish. Please try again.',
          detail: errorData.detail,
        };
        return { success: false, bookId, error };
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        const error: PublishError = {
          type: 'validation',
          message: errorData.detail || errorData.error || 'Validation failed.',
          detail: errorData.detail || errorData.error,
        };
        return { success: false, bookId, error };
      }

      if (response.status >= 500) {
        const errorData = await response.json().catch(() => ({}));
        const error: PublishError = {
          type: 'server',
          message: errorData.detail || 'Publish failed due to server error.',
          detail: errorData.detail,
        };
        return { success: false, bookId, error };
      }

      if (response.ok) {
        const data = await response.json() as { pagesPublished?: number; bookId?: string | number };
        return {
          success: true,
          bookId: data.bookId || bookId,
          pagesPublished: data.pagesPublished,
        };
      }

      const errorData = await response.json().catch(() => ({}));
      const error: PublishError = {
        type: 'server',
        message: errorData.detail || `Publish failed with status ${response.status}`,
        detail: errorData.detail,
      };
      return { success: false, bookId, error };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const error: PublishError = {
        type: 'server',
        message: message.includes('Network') ? 'Network error. Please try again.' : 'Publish failed. Please try later.',
        detail: message,
      };
      return { success: false, bookId, error };
    }
  },

  async getBook(bookId: string | number): Promise<Book> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Book>(`/books/${bookId}/`);
  },

  async getBookAuditLog(bookId: string | number, filters?: AuditLogFilters, limit?: number): Promise<AuditLogResponse> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');

    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.userId) params.append('user_id', filters.userId.toString());
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `/books/${bookId}/audit/${queryString ? `?${queryString}` : ''}`;

    return request<AuditLogResponse>(url);
  },

  async getBookTheme(bookId: string | number): Promise<Record<string, unknown>> {
    if (!hasApi) return {};
    try {
      return await request<Record<string, unknown>>(`/books/${bookId}/theme/`, { skipAuth: true });
    } catch {
      return {};
    }
  },

  async saveBookTheme(bookId: string | number, themeData: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Record<string, unknown>>(`/books/${bookId}/theme/`, {
      method: 'PATCH',
      body: JSON.stringify(themeData),
    });
  },

  // ── Saved Pages (cross-device reader bookmarks) ──

  async getSavedPages(bookId: string | number): Promise<{ count: number; max: number; results: Array<{ id: number; page_number: number; created_at: string }> }> {
    if (!hasApi) return { count: 0, max: 10, results: [] };
    return request(`/books/${bookId}/saved-pages/`);
  },

  async savePage(bookId: string | number, pageNumber: number): Promise<{ id: number; page_number: number; created_at: string }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/books/${bookId}/saved-pages/`, {
      method: 'POST',
      body: JSON.stringify({ page_number: pageNumber }),
    });
  },

  async unsavePage(bookId: string | number, pageNumber: number): Promise<void> {
    if (!hasApi) return;
    await request(`/books/${bookId}/saved-pages/${pageNumber}/`, { method: 'DELETE' });
  },

  async clearSavedPages(bookId: string | number): Promise<void> {
    if (!hasApi) return;
    await request(`/books/${bookId}/saved-pages/`, { method: 'DELETE' });
  },

  // ── Reading Position (single cross-device "I'm here" bookmark) ────────────

  async getReadingPosition(bookId: string | number): Promise<{ id: number; page_number: number; updated_at: string } | null> {
    if (!hasApi) return null;
    try {
      return await request(`/books/${bookId}/reading-position/`);
    } catch {
      return null; // 404 = no position set
    }
  },

  async setReadingPosition(bookId: string | number, pageNumber: number): Promise<{ id: number; page_number: number; updated_at: string }> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request(`/books/${bookId}/reading-position/`, {
      method: 'PUT',
      body: JSON.stringify({ page_number: pageNumber }),
    });
  },

  async clearReadingPosition(bookId: string | number): Promise<void> {
    if (!hasApi) return;
    await request(`/books/${bookId}/reading-position/`, { method: 'DELETE' });
  },
};

export { fetchWithRefresh };

export const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return message.includes('network')
    || message.includes('timeout')
    || message.includes('abort')
    || message.includes('500')
    || message.includes('502')
    || message.includes('503')
    || message.includes('504');
};
