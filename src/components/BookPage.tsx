import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ShoppingBag, Info, CheckCircle2, Loader2, Zap, Star, MessageSquare, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SEOMeta } from './SEOMeta';
import { Breadcrumbs } from './Breadcrumbs';
import {
  buildBookReviewJsonLd,
  buildBookBreadcrumbJsonLd,
  buildBookJsonLd,
  getAggregateRatingFromReviews,
  getBookCoverImage,
  getBookPath,
  normalizePriceValue,
  resolveOgImage,
} from '../lib/seo';
import { api } from '../services/api';
import type { Book, Review, User } from '../types';

interface BookPageProps {
  book: Book;
  relatedBooks: Book[];
  user: User | null;
  isAuthLoading: boolean;
  onBack: () => void;
  onAddToCart: () => void;
  onOpenBook: (book: Book) => void;
}

export const BookPage: React.FC<BookPageProps> = ({ book, relatedBooks, user, isAuthLoading, onBack, onAddToCart, onOpenBook }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [purchasedBooks, setPurchasedBooks] = useState<Set<string | number>>(new Set());
  const [loadingOwnership, setLoadingOwnership] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const response = await api.getBookReviews(book.id);
        const data = response.results;
        setReviews(data);
        // Check if user has already reviewed this book
        const existingUserReview = data.find(r =>
          r.userHandle ? r.userHandle === user?.handle : r.user === user?.name
        );
        setUserReview(existingUserReview ?? null);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [book.id, user?.handle]);

  useEffect(() => {
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewContent('');
    setReviewError(null);
  }, [book.id]);

  useEffect(() => {
    const fetchLibrary = async () => {
      if (isAuthLoading) return;
      if (!user) {
        setPurchasedBooks(new Set());
        setLoadingOwnership(false);
        return;
      }
      setLoadingOwnership(true);
      try {
        const purchased = await api.getPurchasedLibrary();
        setPurchasedBooks(new Set(purchased.map(b => b.id)));
      } catch (err) {
        console.error('Failed to fetch library:', err);
        setPurchasedBooks(new Set());
      } finally {
        setLoadingOwnership(false);
      }
    };
    fetchLibrary();
  }, [user, isAuthLoading]);

  const canReview = purchasedBooks.has(book.id);

  const relatedArtifacts = useMemo(() => {
    const uniqueById = new Map<string, Book>();
    relatedBooks.forEach((item) => {
      const key = String(item.id);
      if (!uniqueById.has(key) && String(item.id) !== String(book.id)) {
        uniqueById.set(key, item);
      }
    });

    const candidates = Array.from(uniqueById.values());
    const sameCategory = candidates.filter((item) => item.category === book.category);
    const otherCategories = candidates.filter((item) => item.category !== book.category);

    return [...sameCategory, ...otherCategories].slice(0, 4);
  }, [relatedBooks, book.id, book.category]);

  const pageCount = useMemo(() => {
    if (typeof book.totalPages === 'number' && book.totalPages > 0) {
      return book.totalPages;
    }
    if (typeof book.total_pages === 'number' && book.total_pages > 0) {
      return book.total_pages;
    }
    if (Array.isArray(book.pages) && book.pages.length > 0) {
      return book.pages.length;
    }
    return null;
  }, [book.totalPages, book.total_pages, book.pages]);

  const handleVote = async (reviewId: string | number, voteType: 1 | -1) => {
    try {
      const result = await api.voteOnReview(reviewId, voteType);
      // Update local state with new vote counts
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, upvotes: result.upvotes, downvotes: result.downvotes, userVote: voteType }
          : review
      ));
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleRemoveVote = async (reviewId: string | number) => {
    try {
      const result = await api.removeVote(reviewId);
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, upvotes: result.upvotes, downvotes: result.downvotes, userVote: null }
          : review
      ));
    } catch (err) {
      console.error('Failed to remove vote:', err);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewError('Please select a rating');
      return;
    }
    if (!reviewContent.trim()) {
      setReviewError('Please enter a review');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      if (userReview) {
        // Update existing review
        await api.updateReview(userReview.id, {
          rating: reviewRating,
          content: reviewContent
        });
      } else {
        // Create new review
        await api.createReview({
          book: book.id,
          rating: reviewRating,
          content: reviewContent
        });
      }

      // Refresh reviews
      const updatedResponse = await api.getBookReviews(book.id);
      const updatedReviews = updatedResponse.results;
      setReviews(updatedReviews);
      const existingUserReview = updatedReviews.find(r =>
        r.userHandle ? r.userHandle === user?.handle : r.user === user?.name
      );
      if (existingUserReview) {
        setUserReview(existingUserReview);
      }

      // Reset form
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewContent('');
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = () => {
    if (userReview) {
      setReviewRating(userReview.rating);
      setReviewContent(userReview.content);
      setShowReviewForm(true);
    }
  };

  const bookCover = getBookCoverImage(book);
  const bookOgImage = resolveOgImage(bookCover);
  const aggregateRating = useMemo(() => getAggregateRatingFromReviews(reviews), [reviews]);
  const bookJsonLd = useMemo(() => buildBookJsonLd(book, { aggregateRating }), [aggregateRating, book]);
  const breadcrumbJsonLd = useMemo(() => buildBookBreadcrumbJsonLd(book), [book]);
  const reviewJsonLd = useMemo(
    () => reviews.slice(0, 5).map((review) => buildBookReviewJsonLd(book, {
      authorName: review.user,
      datePublished: review.date,
      reviewBody: review.content,
      rating: review.rating,
    })),
    [book, reviews],
  );
  const normalizedPrice = normalizePriceValue(book.price);
  const accessRule = book.access_type === 'scientific'
    ? 'სამეცნიერო: მუდმივი წვდომა, წყლის ნიშნით ჩამოტვირთვა'
    : 'სასწავლო: წვდომა 6 თვით, ჩამოტვირთვის გარეშე';

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black">
        <SEOMeta
          title={`${book.title} — ${book.author}`}
          description={book.description || `${book.title} — ${book.author}-ის წიგნი Quaduni-ზე`}
          image={bookOgImage}
          ogImageAlt={`${book.title} — გარეკანი`}
          canonical={getBookPath(book)}
          type="book"
          jsonLd={[bookJsonLd, breadcrumbJsonLd, ...reviewJsonLd]}
      />
      <div className="container mx-auto px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'მთავარი', path: '/' },
              { label: 'წიგნები', path: '/books' },
              { label: book.title }
            ]}
          />
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] mb-12 hover:text-[#FFFF2E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
          [ არქივში დაბრუნება ]
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Visual Section */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-[4/5] md:aspect-[16/9] lg:aspect-square overflow-hidden border-4 border-white group"
            >
              <ImageWithFallback
                src={book.img || book.coverUrl || book.cover_image_url || ''}
                className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 scale-110 group-hover:scale-100"
                alt={book.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              {book.tag && (
                <div className="absolute top-8 left-8 bg-[#FFFF2E] text-black px-6 py-2 text-xl font-black uppercase -rotate-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  {book.tag}
                </div>
              )}

              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
              </div>
            </motion.div>


          </div>

          {/* Info Section */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6 lg:space-y-10"
            >
              <div className="space-y-2 lg:space-y-4">
                <div className="flex items-center gap-4 text-[#FFFF2E]">
                  <span className="text-xs font-black uppercase tracking-widest">{book.category}</span>
                  <span className="w-8 lg:w-12 h-[1px] bg-[#FFFF2E]/30" />
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.8] tracking-tighter">
                  {book.title}
                </h1>
                <h2 className="text-xl lg:text-2xl font-black uppercase italic text-gray-400">
                  ავტორი: {book.author}
                </h2>
              </div>

              <div className="flex items-baseline gap-4 lg:gap-6 border-y-2 border-white/10 py-6 lg:py-8">
                <span className="text-5xl lg:text-6xl font-black text-[#FFFF2E]">{normalizedPrice ? `₾${normalizedPrice}` : book.price}</span>
                {book.oldPrice && (
                  <span className="text-xl lg:text-2xl font-black text-gray-600 line-through italic">{book.oldPrice}</span>
                )}
              </div>

              <div className="space-y-6">
                <p className="text-sm font-bold uppercase leading-relaxed text-gray-300">
                  {book.description || 'აღწერა მიუწვდომელია'}
                </p>

                <div className="border-2 border-[#FFFF2E]/20 bg-[#FFFF2E]/5 p-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFFF2E]">
                  {accessRule}
                </div>

              </div>

              <div className="flex flex-col gap-4 book-action-container">
                {(isAuthLoading || loadingOwnership) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                  </div>
                ) : (
                  <button
                    onClick={onAddToCart}
                    className="group relative py-8 md:py-8 text-2xl font-black uppercase tracking-tighter overflow-hidden transition-all bg-[#FFFF2E] text-black hover:bg-white book-action-btn"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-4">
                      ყიდვა <ShoppingBag className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                )}
              </div>

              <div className="pt-12 mt-12 border-t-2 border-white/10 space-y-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em]">
                  <span>ტექნიკური მახასიათებლები</span>
                  <span className="w-24 h-[1px] bg-white/20" />
                </div>
                <div className="grid grid-cols-2 gap-y-4 text-[10px] font-black uppercase">
                  <div className="text-gray-500">გვერდები:</div>
                  <div className="text-right">{pageCount ? `სულ ${pageCount}` : 'უცნობია'}</div>
                  <div className="text-gray-500">ნახვები:</div>
                  <div className="text-right">{book.views ?? 0}</div>
                  <div className="text-gray-500">შეძენილია:</div>
                  <div className="text-right">{book.purchase_count ?? 0}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 pt-16 border-t-2 border-white/10">
          <div className="rws-mob mb-8 flex flex-row items-center justify-between gap-4 sm:flex-row sm:items-center sm:justify-between max-sm:flex-col max-sm:items-start max-sm:gap-6">
            <h3 className="flex items-center gap-4 text-3xl font-black uppercase tracking-tighter max-sm:text-2xl max-sm:w-full">
              <MessageSquare className="w-8 h-8 text-[#FFFF2E] max-sm:w-6 max-sm:h-6" />
              შეფასებები
              <span className="text-lg text-gray-500 max-sm:text-base">({reviews.length})</span>
            </h3>

            {/* Add Review Button - Only for purchasers */}
            {canReview && !showReviewForm && (
              <button
                onClick={() => userReview ? handleEditReview() : setShowReviewForm(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FFFF2E] text-black font-black uppercase text-xs tracking-wider hover:bg-white transition-colors whitespace-nowrap max-sm:w-full max-sm:py-4"
              >
                {userReview ? (
                  <>
                    <Star className="w-4 h-4" />
                    შეფასების რედაქტირება
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    შეფასების დაწერა
                  </>
                )}
              </button>
            )}
          </div>

          {/* Review Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 bg-zinc-900 border-2 border-[#FFFF2E] p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-black uppercase tracking-tighter">
                    {userReview ? 'შეფასების რედაქტირება' : 'შეფასების დაწერა'}
                  </h4>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewError(null);
                      setReviewRating(0);
                      setReviewContent('');
                    }}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Rating Selection */}
                <div className="mb-6">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3 block">
                    შეფასება
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${star <= (hoverRating || reviewRating)
                            ? 'text-[#FFFF2E] fill-[#FFFF2E]'
                            : 'text-gray-600'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-bold text-[#FFFF2E]">
                      {reviewRating > 0 && `${reviewRating}/5`}
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-6">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3 block">
                    ტექსტი
                  </label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="გაგვიზიარეთ თქვენი შთაბეჭდილება ნაწარმოებზე..."
                    rows={4}
                    className="w-full bg-black border-2 border-white/20 p-4 text-sm text-white placeholder-gray-600 focus:border-[#FFFF2E] focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Error Message */}
                {reviewError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase">
                    {reviewError}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewError(null);
                      setReviewRating(0);
                      setReviewContent('');
                    }}
                    className="px-6 py-3 border-2 border-white/20 font-black uppercase text-xs tracking-wider hover:bg-white/10 transition-colors"
                  >
                    გაუქმება
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FFFF2E] text-black font-black uppercase text-xs tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        იგზავნება...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {userReview ? 'შეფასების განახლება' : 'შეფასების გაგზავნა'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingReviews ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFFF2E]" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/10">
              <p className="text-sm font-bold uppercase text-gray-500">
                შეფასებები ჯერ არ არის
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/50 border border-white/10 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {review.avatar ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FFFF2E]">
                          <ImageWithFallback
                            src={review.avatar}
                            className="w-full h-full object-cover"
                            alt={review.user}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-[#FFFF2E] text-black flex items-center justify-center font-black text-lg rounded-full">
                          {review.user?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-black uppercase text-sm">{review.user}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating
                            ? 'text-[#FFFF2E] fill-[#FFFF2E]'
                            : 'text-gray-600'
                            }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {review.content}
                  </p>

                  {/* Vote Buttons */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() =>
                        review.userVote === 1
                          ? handleRemoveVote(review.id)
                          : handleVote(review.id, 1)
                      }
                      className={`flex items-center gap-1 text-xs font-bold uppercase transition-colors ${review.userVote === 1
                        ? 'text-[#FFFF2E]'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                      <ThumbsUp
                        className={`w-4 h-4 ${review.userVote === 1 ? 'fill-[#FFFF2E]' : ''
                          }`}
                      />
                      {review.upvotes || 0}
                    </button>

                    <button
                      onClick={() =>
                        review.userVote === -1
                          ? handleRemoveVote(review.id)
                          : handleVote(review.id, -1)
                      }
                      className={`flex items-center gap-1 text-xs font-bold uppercase transition-colors ${review.userVote === -1
                        ? 'text-red-500'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                      <ThumbsDown
                        className={`w-4 h-4 ${review.userVote === -1 ? 'fill-red-500' : ''
                          }`}
                      />
                      {review.downvotes || 0}
                    </button>

                    <span className="text-xs text-gray-600 ml-auto">
                      NET: {(review.upvotes || 0) - (review.downvotes || 0)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Similar Artifacts Section */}
        <div className="mt-40 pt-20 border-t-8 border-[#FFFF2E]">
          <h3 className="text-4xl font-black uppercase tracking-tighter mb-12">მსგავსი წიგნები</h3>
          {relatedArtifacts.length === 0 ? (
            <div className="text-sm text-gray-500 uppercase tracking-widest">მსგავსი წიგნები ვერ მოიძებნა</div>
          ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {relatedArtifacts.map((relatedItem) => (
                <Link
                  key={relatedItem.id}
                  to={getBookPath(relatedItem)}
                  state={{ book: relatedItem }}
                  onClick={() => onOpenBook(relatedItem)}
                  className="space-y-4 group block cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                >
                  <div className="aspect-[3/4] bg-zinc-900 border-2 border-white/10 overflow-hidden relative">
                    <ImageWithFallback src={relatedItem.img || relatedItem.coverUrl || relatedItem.cover_image_url || ''} className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" alt={relatedItem.title} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#FFFF2E]/80 transition-opacity">
                      <span className="text-black font-black uppercase text-xs tracking-widest italic">დეტალების ნახვა</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-black uppercase">{relatedItem.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

