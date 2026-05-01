import type {
  Book,
  User,
  Review,
  CommunityPost,
  CommunityPostComment,
  Order,
  WalletStats,
  WalletTransaction,
  DepositInitiateResponse,
  DepositStatusResponse,
  CartCheckoutResponse,
  CartCheckoutStatusResponse,
  PaginatedResponse,
  Ad,
  AdListItem,
  AdPublisher,
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

const extractApiErrorMessage = (errorBody: unknown): string | null => {
  if (typeof errorBody === 'string') {
    const trimmed = errorBody.trim();
    return trimmed || null;
  }

  if (Array.isArray(errorBody)) {
    for (const item of errorBody) {
      const message = extractApiErrorMessage(item);
      if (message) return message;
    }
    return null;
  }

  if (errorBody && typeof errorBody === 'object') {
    const record = errorBody as Record<string, unknown>;
    const priorityKeys = ['error', 'message', 'detail', 'non_field_errors'];

    for (const key of priorityKeys) {
      if (key in record) {
        const message = extractApiErrorMessage(record[key]);
        if (message) return message;
      }
    }

    for (const value of Object.values(record)) {
      const message = extractApiErrorMessage(value);
      if (message) return message;
    }
  }

  return null;
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
    const message = extractApiErrorMessage(errorBody) || 'REQUEST_FAILED';
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

export const api = {
  async getBooks(params?: {
    search?: string;
    category?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Book>> {
    if (!hasApi) return { results: [], count: 0, next: null, previous: null };
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.ordering) query.set('ordering', params.ordering);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await request<PaginatedResponse<Book>>(`/books/${suffix}`, { skipAuth: true });
    return {
      results: response.results || [],
      count: response.count || 0,
      next: response.next || null,
      previous: response.previous || null,
    };
  },

  async getFeaturedBooks(): Promise<Book[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Book>>('/books/featured/', { skipAuth: true });
    return response.results || [];
  },

async getReviews(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Review>> {
    if (!hasApi) return { results: [], count: 0, next: null, previous: null };
    const response = await request<PaginatedResponse<Review>>(`/reviews/?page=${page}&page_size=${pageSize}`, { skipAuth: true });
    return {
      results: response.results || [],
      count: response.count || 0,
      next: response.next || null,
      previous: response.previous || null,
    };
  },

  async getBookReviews(bookId: string | number, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Review>> {
    if (!hasApi) return { results: [], count: 0, next: null, previous: null };
    const response = await request<PaginatedResponse<Review>>(`/reviews/?book=${bookId}&page=${page}&page_size=${pageSize}`, { skipAuth: true });
    return {
      results: response.results || [],
      count: response.count || 0,
      next: response.next || null,
      previous: response.previous || null,
    };
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

  async getPurchasedLibrary(): Promise<Book[]> {
    if (!hasApi) return [];
    const response = await request<PaginatedResponse<Book>>('/library/purchased/');
    return response.results || [];
  },

  async getWalletStats(): Promise<WalletStats | null> {
    if (!hasApi) return null;
    return request<WalletStats>('/wallet/stats/');
  },

  async getWalletTransactions(): Promise<WalletTransaction[]> {
    if (!hasApi) return [];
    return request<WalletTransaction[]>('/wallet/transactions/');
  },

  async deposit(amount: number): Promise<DepositInitiateResponse> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<DepositInitiateResponse>('/wallet/deposit/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async getAds(params?: {
    publisher?: string;
    category?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AdListItem>> {
    if (!hasApi) return { results: [], count: 0, next: null, previous: null };

    const query = new URLSearchParams();
    if (params?.publisher) query.set('publisher', params.publisher);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PaginatedResponse<AdListItem>>(`/blog/${suffix}`, { skipAuth: true });
  },

  async getAd(slug: string): Promise<Ad> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Ad>(`/blog/${encodeURIComponent(slug)}/`, { skipAuth: true });
  },

  async getAdPublishers(): Promise<AdPublisher[]> {
    if (!hasApi) return [];
    return request<AdPublisher[]>('/blog/publishers/', { skipAuth: true });
  },

  async getAdCategories(): Promise<Array<{ category: string; count: number }>> {
    if (!hasApi) return [];
    return request<Array<{ category: string; count: number }>>('/blog/categories/', { skipAuth: true });
  },

  async getDepositStatus(orderId: string): Promise<DepositStatusResponse> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<DepositStatusResponse>(`/wallet/deposit/status/?order_id=${encodeURIComponent(orderId)}`);
  },

  async createOrder(payload: { bookId: Book['id'] }): Promise<Order> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Order>('/orders/', {
      method: 'POST',
      body: JSON.stringify({ book: payload.bookId }),
    });
  },

  async checkoutCart(payload: { bookIds: Array<Book['id']> }): Promise<CartCheckoutResponse> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<CartCheckoutResponse>('/orders/checkout/', {
      method: 'POST',
      body: JSON.stringify({ books: payload.bookIds }),
    });
  },

  async getCartCheckoutStatus(orderId: string): Promise<CartCheckoutStatusResponse> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<CartCheckoutStatusResponse>(`/orders/checkout/status/?order_id=${encodeURIComponent(orderId)}`);
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

  async getBook(bookId: string | number): Promise<Book> {
    if (!hasApi) throw new Error('BACKEND_NOT_CONFIGURED');
    return request<Book>(`/books/${bookId}/`, { skipAuth: true });
  },

  async getBookTheme(bookId: string | number): Promise<Record<string, unknown>> {
    if (!hasApi) return {};
    try {
      return await request<Record<string, unknown>>(`/books/${bookId}/theme/`, { skipAuth: true });
    } catch {
      return {};
    }
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
