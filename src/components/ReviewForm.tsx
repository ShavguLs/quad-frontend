import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { X, Loader2 } from 'lucide-react';
import type { Review, Book } from '../types';

interface ReviewFormProps {
  book: Book;
  existingReview?: Review | null;
  onSubmit: (data: { rating: number; content: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  book,
  existingReview,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('გთხოვთ აირჩიოთ ვარსკვლავების შეფასება');
      return;
    }

    if (content.trim().length < 10) {
      setError('მიმოხილვა უნდა იყოს მინიმუმ 10 სიმბოლო');
      return;
    }

    try {
      await onSubmit({ rating, content });
    } catch (err: any) {
      setError(err.message || 'მიმოხილვის გამოგზავნა ვერ მოხერხდა');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border-2 border-[#FFFF2E]/30 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-widest">
          {existingReview ? 'მიმოხილვის რედაქტირება' : 'მიმოხილვის დაწერა'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-white/10 transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-[#FFFF2E]/10 border border-[#FFFF2E]/30 px-4 py-2 inline-block">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#FFFF2E]">
          REF: {book.title}
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          შეაფასეთ ეს წიგნი *
        </label>
        <StarRating
          rating={rating}
          interactive={!isSubmitting}
          size="lg"
          onChange={setRating}
        />
        {rating > 0 && (
          <span className="text-[10px] font-black uppercase text-[#FFFF2E]">
            {rating === 5 && 'აუცილებელი'}
            {rating === 4 && 'რეკომენდებული'}
            {rating === 3 && 'კარგი'}
            {rating === 2 && 'სუსტი'}
            {rating === 1 && 'გამოტოვება'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          შენი მიმოხილვა *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="გაგვიზიარეთ თქვენი აზრები ამ წიგნზე..."
          className="w-full bg-black border-2 border-white/20 p-4 text-sm font-bold uppercase leading-relaxed placeholder:text-gray-600 focus:border-[#FFFF2E] focus:outline-none transition-colors resize-none"
          rows={6}
          disabled={isSubmitting}
        />
        <div className="flex justify-between text-[10px] font-black uppercase text-gray-600">
          <span>{content.length} სიმბოლო</span>
          <span>მინ: 10</span>
        </div>
      </div>

      {error && (
        <div className="border-2 border-red-600/40 bg-red-600/10 text-red-500 p-4 text-[10px] font-black uppercase tracking-widest">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0 || content.trim().length < 10}
        className="w-full bg-[#FFFF2E] text-black py-4 text-lg font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            იგზავნება...
          </>
        ) : existingReview ? (
          'მიმოხილვის განახლება'
        ) : (
          'მიმოხილვის გამოგზავნა'
        )}
      </button>
    </form>
  );
};

export default ReviewForm;
