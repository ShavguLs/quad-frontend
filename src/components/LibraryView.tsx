import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen, 
  Search, 
  LayoutGrid, 
  List, 
  Loader2, 
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Star,
  MessageSquare
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ReviewForm } from './ReviewForm';
import { StarRating } from './StarRating';
import { api } from '../services/api';
import type { User as AppUser, Book, Review } from '../types';

interface LibraryViewProps {
  onBack: () => void;
  onBookClick: (book: any) => void;
  user: AppUser | null;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onBack, onBookClick, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingBook, setReviewingBook] = useState<Book | null>(null);
  const [userReviews, setUserReviews] = useState<Record<string | number, Review>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, reviewsData] = await Promise.all([
        api.getLibrary(),
        api.getReviews().catch(() => [])
      ]);
      setBooks(data || []);
      
      // Create a map of bookId -> user's review
      const reviewsMap: Record<string | number, Review> = {};
      reviewsData?.forEach((review: Review) => {
        const bookId = review.bookId || review.book;
        if (bookId) {
          reviewsMap[bookId] = review;
        }
      });
      setUserReviews(reviewsMap);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLibrary();
    } else {
      setLoading(false);
      setBooks([]);
      setError('AUTHENTICATION_REQUIRED');
    }
  }, [user]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBooks = books.filter((book) => {
    const title = (book.title ?? '').toLowerCase();
    if (!normalizedQuery) return true;
    return title.includes(normalizedQuery);
  });

  const handleReviewSubmit = async (data: { rating: number; content: string }) => {
    if (!reviewingBook) return;
    
    setIsSubmittingReview(true);
    setReviewError(null);
    
    try {
      const existingReview = userReviews[reviewingBook.id];
      
      if (existingReview) {
        // Update existing review
        await api.updateReview(existingReview.id, data);
      } else {
        // Create new review
        await api.createReview({
          book: reviewingBook.id,
          rating: data.rating,
          content: data.content
        });
      }
      
      // Refresh reviews
      await fetchLibrary();
      setReviewingBook(null);
    } catch (err: any) {
      setReviewError(err.message || 'შეფასება ვერ გაიგზავნა');
      throw err;
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (reviewingBook) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 md:pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <button
            onClick={() => setReviewingBook(null)}
            className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-[#FFFF2E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ბიბლიოთეკაში დაბრუნება
          </button>
          
          <ReviewForm
            book={reviewingBook}
            existingReview={userReviews[reviewingBook.id] || null}
            onSubmit={handleReviewSubmit}
            onCancel={() => setReviewingBook(null)}
            isSubmitting={isSubmittingReview}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 md:pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-12 md:mb-20 border-l-4 md:border-l-8 border-[#FFFF2E] pl-4 md:pl-8">
          <div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.75]">
              შეძენილი<br />
              <span className="text-[#FFFF2E]">წიგნები</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600 mt-6 italic">ჩემი კოლექცია</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
            <div className="relative group flex-1 sm:w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#FFFF2E] transition-colors" />
               <input 
                type="text" 
                placeholder="წიგნის ძიება..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border-2 border-white/10 p-4 pl-12 text-[10px] font-black uppercase outline-none focus:border-[#FFFF2E] transition-all"
               />
            </div>
            <div className="flex border-2 border-white/10 p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-[#FFFF2E] text-black' : 'hover:bg-white/5 text-gray-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-3 transition-all ${viewMode === 'list' ? 'bg-[#FFFF2E] text-black' : 'hover:bg-white/5 text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30">
              <Loader2 className="w-16 h-16 animate-spin text-[#FFFF2E]" />
              <span className="text-xs font-black uppercase tracking-[0.5em]">იტვირთება...</span>
            </div>
          ) : error ? (
            <div className="p-20 border-4 border-red-600/20 bg-red-600/5 text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
              <h3 className="text-3xl font-black uppercase">ვერ ჩაიტვირთა</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{error}</p>
              <button onClick={fetchLibrary} className="bg-red-600 text-white px-8 py-4 text-[10px] font-black uppercase hover:bg-white hover:text-red-600 transition-all">სცადე თავიდან</button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="p-24 border-4 border-dashed border-white/10 text-center space-y-8 opacity-40">
              <Database className="w-20 h-20 mx-auto text-gray-700" />
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">ბიბლიოთეკა ცარიელია</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4">შეძენილი წიგნები არ მოიძებნა</p>
              </div>
              <button onClick={onBack} className="bg-white text-black px-12 py-5 text-xs font-black uppercase hover:bg-[#FFFF2E] transition-all">[ კატალოგის ნახვა ]</button>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                  <AnimatePresence mode="popLayout">
                    {filteredBooks.map((book, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={book.id}
                        className="group relative bg-zinc-950 border-4 border-white/5 hover:border-[#FFFF2E] transition-all shadow-xl overflow-hidden"
                      >
                        <div className="aspect-[3/4] relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                          <ImageWithFallback src={book.coverUrl || book.cover_image_url || ''} className="w-full h-full object-cover brightness-50 group-hover:brightness-100 transition-all scale-110 group-hover:scale-100" alt={book.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                          
                          {/* Overlay Controls */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                            <button 
                              onClick={() => navigate(`/reader/${book.id}`, { state: { backgroundLocation: location, book } })}
                              className="w-40 bg-[#FFFF2E] text-black py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
                            >
                              <BookOpen className="w-4 h-4" /> წაკითხვა
                            </button>
                            <button 
                              onClick={() => setReviewingBook(book)}
                              className="w-40 border-2 border-[#FFFF2E] text-[#FFFF2E] py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FFFF2E] hover:text-black transition-all"
                            >
                              <Star className="w-4 h-4" /> 
                              {userReviews[book.id] ? 'შეფასების რედ.' : 'შეფასება'}
                            </button>
                          </div>
                        </div>

                        <div className="p-6 space-y-3 bg-zinc-950">
                          <div className="flex justify-between items-start">
                             <div className="space-y-1">
                               <h3 className="text-xl font-black uppercase leading-none tracking-tighter group-hover:text-[#FFFF2E] transition-colors">{book.title}</h3>
                               <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-[#FFFF2E]" /> {(book.created_at || book.createdAt) ? new Date(book.created_at || book.createdAt).toLocaleDateString() : 'თარიღი უცნობია'}
                                </span>
                             </div>
                          </div>
                          
                          {/* Review indicator */}
                          {userReviews[book.id] && (
                            <div className="flex items-center gap-2 py-2">
                              <StarRating rating={userReviews[book.id]?.rating} size="sm" />
                               <span className="text-[8px] font-black uppercase text-gray-500">
                                შენი შეფასება
                              </span>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                             <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">ID: {book.id.toString().slice(-8)}</span>
                             <div className="flex items-center gap-2">
                                {userReviews[book.id] ? (
                                  <span className="text-[8px] font-black uppercase text-[#FFFF2E]">შეფასებულია</span>
                                ) : (
                                  <span className="text-[8px] font-black uppercase text-gray-600">შეუფასებელი</span>
                                )}
                               <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-[#FFFF2E] transition-colors" />
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredBooks.map((book, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={book.id}
                        className="bg-zinc-950 border-2 border-white/5 p-4 hover:border-[#FFFF2E] transition-all group flex flex-col md:flex-row items-center gap-8"
                      >
                        <div className="w-20 aspect-[3/4] border-2 border-white/10 overflow-hidden grayscale group-hover:grayscale-0 flex-shrink-0">
                          <ImageWithFallback src={book.coverUrl || book.cover_image_url || ''} className="w-full h-full object-cover" alt={book.title} />
                        </div>
                        
                        <div className="flex-1 space-y-1 text-center md:text-left">
                          <h3 className="text-2xl font-black uppercase tracking-tighter group-hover:text-[#FFFF2E] transition-colors">{book.title}</h3>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[9px] font-black text-gray-600 uppercase">
                            <span className="flex items-center gap-2"><FileText className="w-3 h-3" /> ID: {book.id}</span>
                            <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> შეძენილია: {(book.created_at || book.createdAt) ? new Date(book.created_at || book.createdAt).toLocaleDateString() : 'თარიღი უცნობია'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => navigate(`/reader/${book.id}`, { state: { backgroundLocation: location, book } })}
                            className="bg-white text-black px-6 py-3 text-[10px] font-black uppercase hover:bg-[#FFFF2E] transition-all flex items-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" /> წაკითხვა
                          </button>
                          <button 
                            onClick={() => setReviewingBook(book)}
                            className={`px-6 py-3 text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                              userReviews[book.id] 
                                ? 'bg-[#FFFF2E] text-black hover:bg-white' 
                                : 'border-2 border-white/10 text-gray-500 hover:text-white hover:border-white'
                            }`}
                          >
                            <Star className="w-4 h-4" /> {userReviews[book.id] ? 'შეფასების რედ.' : 'შეფასება'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>

        {/* Technical Info */}
        <div className="mt-32 pt-12 border-t-2 border-white/5 opacity-20 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">
           <span>ბიბლიოთეკა // დაცული</span>
           <span>quaduni.com // შენი კოლექცია</span>
        </div>
      </div>
    </div>
  );
};

