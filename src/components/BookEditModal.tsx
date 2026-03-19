import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { MyBook } from '../types';

interface BookEditModalProps {
  book: MyBook;
  onSave: (updatedBook: MyBook) => void;
  onCancel: () => void;
}

export const BookEditModal: React.FC<BookEditModalProps> = ({ book, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: book.title || '',
    author: book.author || '',
    description: book.description || '',
    price: book.price || '0',
    category: book.category || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('სათაური სავალდებულოა');
      }
      if (!formData.author.trim()) {
        throw new Error('ავტორი სავალდებულოა');
      }
      if (parseFloat(formData.price) < 0) {
        throw new Error('ფასი არ შეიძლება იყოს უარყოფითი');
      }

      await api.updateBook(book.id, {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        price: formData.price,
        category: formData.category,
      });

      // Create updated book object for UI
      const updatedBook: MyBook = {
        ...book,
        title: formData.title,
        author: formData.author,
        description: formData.description,
        category: formData.category,
        price: formData.price,
      };

      onSave(updatedBook);
    } catch (err: any) {
      setError(err.message || 'განახლება ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[220] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md sm:p-6">
      <div className="w-[min(92vw,640px)] max-h-[80vh] overflow-hidden rounded-2xl border border-white/20 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.7)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-[0.18em] text-white">წიგნის რედაქტირება</h2>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">მონაცემების განახლება</p>
          </div>
          <button onClick={onCancel} className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors" aria-label="Close edit modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {error && (
              <div className="mb-5 rounded-lg border border-red-500/50 bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
            )}

            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">სათაური *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-3 text-sm font-semibold outline-none focus:border-[#FFFF2E] transition-colors"
                />
              </div>

              {/* Author */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">ავტორი *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-3 text-sm font-semibold outline-none focus:border-[#FFFF2E] transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">აღწერა</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-3 text-sm outline-none focus:border-[#FFFF2E] transition-colors resize-none"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">ფასი (₾) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-3 text-sm font-semibold outline-none focus:border-[#FFFF2E] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">კატეგორია</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-3 text-sm font-semibold outline-none focus:border-[#FFFF2E] transition-colors"
                  />
                </div>
              </div>

              {/* Status */}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-zinc-950 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto rounded-lg border border-white/20 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:border-white hover:text-white transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-lg bg-[#FFFF2E] px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ინახება...
                </>
              ) : (
                'შენახვა'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};
