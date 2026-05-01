export type PaperColor = 'white' | 'cream' | 'sepia' | 'gray' | 'dark' | 'blue' | 'green';
export type BookAccessType = 'educational' | 'scientific';

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
  url_slug?: string;
  title: string;
  author: string;
  price: string;
  access_type?: BookAccessType;
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
  purchase_count?: number;
  access_expires_at?: string | null;
  access_is_expired?: boolean;
}

export interface AdPublisher {
  id: string | number;
  handle: string;
  display_name?: string | null;
  profile_image?: string | null;
}

export interface Ad {
  id: string | number;
  publisher: AdPublisher;
  title: string;
  slug: string;
  content: string;
  category: string;
  image?: string | null;
  is_published?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdListItem {
  id: string | number;
  publisher: AdPublisher;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  image?: string | null;
  created_at: string;
  updated_at?: string;
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
  expiresAt?: string | null;
  accessType?: BookAccessType;
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

export interface DepositInitiateResponse {
  message: string;
  orderId: string;
  checkoutUrl: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface DepositStatusResponse {
  orderId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  providerStatus: string;
  credited: boolean;
  amount: string;
}

export type CartCheckoutStatus = 'COMPLETED' | 'PAYMENT_REQUIRED' | 'PENDING' | 'FAILED';

export interface CartCheckoutResponse {
  status: CartCheckoutStatus;
  orders?: Order[];
  orderId?: string;
  checkoutUrl?: string;
  amountDue?: string;
  cartTotal?: string;
  walletBalance?: string;
}

export interface CartCheckoutStatusResponse {
  orderId: string;
  status: CartCheckoutStatus;
  providerStatus?: string;
  orders?: Order[];
  error?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

