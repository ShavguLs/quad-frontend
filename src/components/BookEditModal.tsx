import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Loader2, Edit3 } from 'lucide-react';
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
    accessType: book.access_type || 'educational',
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
      if (!formData.title.trim()) throw new Error('სათაური სავალდებულოა');
      if (!formData.author.trim()) throw new Error('ავტორი სავალდებულოა');
      if (parseFloat(formData.price) < 0) throw new Error('ფასი არ შეიძლება იყოს უარყოფითი');

      await api.updateBook(book.id, {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        accessType: formData.accessType,
      });

      onSave({
        ...book,
        title: formData.title,
        author: formData.author,
        description: formData.description,
        category: formData.category,
        access_type: formData.accessType,
        price: formData.price,
      });
    } catch (err: any) {
      setError(err.message || 'განახლება ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-black border-2 border-white/10 p-4 text-sm font-bold text-white uppercase outline-none focus:border-[#FFFF2E] transition-colors placeholder:text-white/20 placeholder:normal-case';

  const labelClass = 'text-[10px] font-black uppercase tracking-widest text-gray-500';

  const modalContent = (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-zinc-950 border-2 border-[#FFFF2E] w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#FFFF2E]/20">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-[#FFFF2E]" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-[#FFFF2E]">
              წიგნის რედაქტირება
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book reference */}
        <div className="px-6 pt-5 pb-0">
          <div className="p-4 bg-[#FFFF2E]/5 border border-[#FFFF2E]/20 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              ამჟამინდელი სათაური
            </p>
            <p className="text-base font-black text-white uppercase tracking-wide leading-tight truncate">
              "{book.title}"
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-5">
            {error && (
              <div className="p-4 bg-red-600/20 border border-red-600 text-red-400 text-sm font-bold uppercase tracking-wide">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className={labelClass}>სათაური *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>ავტორი *</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>აღწერა</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} normal-case resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>ფასი (₾) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>კატეგორია</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="ზინები">ზინები</option>
                  <option value="წიგნები">წიგნები</option>
                  <option value="ესსეები">ესსეები</option>
                  <option value="ხელოვნება">ხელოვნება</option>
                  <option value="არქივი">არქივი</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>წიგნის ტიპი</label>
              <select
                name="accessType"
                value={formData.accessType}
                onChange={handleChange}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="educational">სასწავლო — წვდომა 6 თვით, ჩამოტვირთვის გარეშე</option>
                <option value="scientific">სამეცნიერო — მუდმივი წვდომა, წყლის ნიშნით ჩამოტვირთვა</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-4 p-6 border-t border-[#FFFF2E]/20">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-4 border-2 border-white/10 text-sm font-black uppercase tracking-widest text-white hover:border-white transition-colors disabled:opacity-50"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-[#FFFF2E] text-black text-sm font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
      </motion.div>
    </div>
  );

  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
};
