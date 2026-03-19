import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { MyBook } from '../types';

interface DeleteBookDialogProps {
  book: MyBook;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteBookDialog: React.FC<DeleteBookDialogProps> = ({ book, onConfirm, onCancel }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (confirmText !== 'წაშლა') {
      setError('დაწერეთ "წაშლა" დასადასტურებლად');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'წაშლა ვერ მოხერხდა');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border-2 border-red-600 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-red-600/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-red-600">წიგნის წაშლა</h2>
          </div>
          <button 
            onClick={onCancel}
            disabled={isDeleting}
            className="p-2 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="p-4 bg-red-600/10 border border-red-600/30 space-y-2">
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">
              თქვენ საბოლოოდ წაშლით:
            </p>
            <p className="text-lg font-black text-[#FFFF2E] uppercase tracking-wide">
              "{book.title}"
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              ID: {book.id}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-600/20 border border-red-600 text-red-400 text-sm">{error}</div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              დაწერეთ "წაშლა" დასადასტურებლად
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="წაშლა"
              disabled={isDeleting}
              className="w-full bg-black border-2 border-red-600/30 p-4 text-sm font-bold uppercase outline-none focus:border-red-600 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 py-4 border-2 border-white/10 text-sm font-black uppercase tracking-widest hover:border-white transition-colors disabled:opacity-50"
            >
              გაუქმება
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting || confirmText !== 'წაშლა'}
              className="flex-1 py-4 bg-red-600 text-white text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  იშლება...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  წაშლა
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
