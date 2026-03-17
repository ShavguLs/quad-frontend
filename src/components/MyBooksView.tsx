import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  SlidersHorizontal,
  Edit3, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle,
  BarChart3,
  Users,
  Eye,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BookEditModal } from './BookEditModal';
import { DeleteBookDialog } from './DeleteBookDialog';
import { api } from '../services/api';
import type { User as AppUser, MyBook } from '../types';

interface MyBooksViewProps {
  onBack: () => void;
  onUploadNew: () => void;
  user: AppUser | null;
}

export const MyBooksView: React.FC<MyBooksViewProps> = ({ onBack, onUploadNew, user }) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<MyBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBook, setEditingBook] = useState<MyBook | null>(null);
  const [deletingBook, setDeletingBook] = useState<MyBook | null>(null);
  const [retryingBookId, setRetryingBookId] = useState<string | number | null>(null);

  const fetchMyBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyBooks();
      setBooks(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyBooks();
    } else {
      setLoading(false);
      setBooks([]);
      setError('AUTHENTICATION_REQUIRED');
    }
  }, [user]);

  useEffect(() => {
    if (!editingBook || typeof window === 'undefined') {
      return;
    }

    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyPaddingRight = bodyStyle.paddingRight;
    const previousHtmlOverflow = htmlStyle.overflow;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    bodyStyle.overflow = 'hidden';
    htmlStyle.overflow = 'hidden';

    if (scrollBarWidth > 0) {
      bodyStyle.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.paddingRight = previousBodyPaddingRight;
      htmlStyle.overflow = previousHtmlOverflow;
    };
  }, [editingBook]);

  const filteredBooks = books.filter(b => 
    b.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (book: MyBook) => {
    setEditingBook(null);
    setDeletingBook(book);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBook) return;
    
    try {
      await api.deleteBook(deletingBook.id);
      setBooks(books.filter(b => b.id !== deletingBook.id));
      setDeletingBook(null);
    } catch (err: any) {
      throw err; // Let the dialog handle the error
    }
  };

  const handleEdit = (book: MyBook) => {
    setDeletingBook(null);
    setEditingBook(book);
  };

  const handleSaveBook = (updatedBook: MyBook) => {
    setBooks(prevBooks => prevBooks.map(b => b.id === updatedBook.id ? updatedBook : b));
    setEditingBook(null);
  };

  const handleCancelEdit = () => {
    setEditingBook(null);
  };

  const handleRetryExtraction = async (bookId: string | number) => {
    setRetryingBookId(bookId);
    try {
      await api.retryBookExtraction(bookId);
      await fetchMyBooks();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'RETRY_FAILED');
    } finally {
      setRetryingBookId(null);
    }
  };

  const isolateCardActionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const isolateCardActionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    action: () => void,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    action();
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black">
      <div className="container mx-auto px-6">
        {/* Navigation & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <button 
            onClick={onBack}
            className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] hover:text-[#FFFF2E] transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
            [ Back To Studio ]
          </button>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Active Manifests</span>
              <span className="text-2xl font-black text-[#FFFF2E]">{books.length}</span>
            </div>
            <button 
              onClick={onUploadNew}
              className="bg-[#FFFF2E] text-black px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center gap-3"
            >
              <Plus className="w-4 h-4" /> New Upload
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="border-l-8 border-[#FFFF2E] pl-8 mb-16">
          <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.75]">
              My<br />
              <span className="text-[#FFFF2E]">Books</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600 mt-6 italic">Creator Control Center V1.0</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-12">
          <div className="relative group flex-1 max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#FFFF2E] transition-colors" />
             <input 
              type="text" 
              placeholder="Search my books..."
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

        {/* Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30">
              <Loader2 className="w-16 h-16 animate-spin text-[#FFFF2E]" />
              <span className="text-xs font-black uppercase tracking-[0.5em]">Loading...</span>
            </div>
          ) : error ? (
            <div className="p-20 border-4 border-red-600/20 bg-red-600/5 text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
              <h3 className="text-3xl font-black uppercase">Load Failed</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{error}</p>
              <button onClick={fetchMyBooks} className="bg-red-600 text-white px-8 py-4 text-[10px] font-black uppercase hover:bg-white hover:text-red-600 transition-all">Try Again</button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="p-24 border-4 border-dashed border-white/10 text-center space-y-8 group">
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase text-zinc-700">No Books Found</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800">You have not uploaded any books yet.</p>
              </div>
              <button 
                onClick={onUploadNew} 
                className="bg-white text-black px-12 py-5 text-xs font-black uppercase hover:bg-[#FFFF2E] transition-all"
              >
                [ Start First Upload ]
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12" : "space-y-4"}>
              <AnimatePresence mode="popLayout">
                {filteredBooks.map((book, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={book.id}
                    className={`bg-zinc-950 border-4 border-white/5 hover:border-[#FFFF2E] transition-all group overflow-hidden ${
                      viewMode === 'list' ? 'flex flex-col md:flex-row items-center p-4 gap-8' : ''
                    }`}
                  >
                    {/* Visual Aspect */}
                    <div className={`${viewMode === 'list' ? 'w-24 aspect-[3/4] flex-shrink-0' : 'aspect-[3/4]'} relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700`}>
                      <ImageWithFallback 
                        src={book.coverUrl || book.cover_image_url || ''} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt={book.title} 
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(event) => {
                              isolateCardActionClick(event);
                              navigate(`/draft/${book.id}`);
                            }}
                            onKeyDown={(event) => isolateCardActionKeyDown(event, () => navigate(`/draft/${book.id}`))}
                            className="p-2 bg-[#FFFF2E] text-black border border-black/40 hover:bg-white transition-all"
                            title="Open tuning"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={(event) => {
                              isolateCardActionClick(event);
                              handleEdit(book);
                            }}
                            onKeyDown={(event) => isolateCardActionKeyDown(event, () => handleEdit(book))}
                            className="p-2 bg-black/80 hover:bg-[#FFFF2E] hover:text-black transition-all"
                            title="Edit metadata"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                           <button 
                             type="button"
                             onClick={(event) => {
                               isolateCardActionClick(event);
                               handleDelete(book);
                             }}
                             onKeyDown={(event) => isolateCardActionKeyDown(event, () => handleDelete(book))}
                             className="p-2 bg-black/80 hover:bg-red-600 transition-all"
                             title="Delete book"
                           >
                             <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                    </div>

                    {/* Meta Aspect */}
                    <div className={`p-6 flex-1 ${viewMode === 'list' ? 'text-center md:text-left p-0' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black uppercase tracking-tighter leading-none group-hover:text-[#FFFF2E] transition-colors">
                            {book.title}
                          </h3>
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic">
                            ID: {book.id.toString().slice(-8)}
                          </span>
                        </div>
                        <div className="text-right">
                           <span className="text-xl font-black text-[#FFFF2E]">{book.price}</span>
                        </div>
                      </div>


                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] ${
                            book.extraction_status === 'failed'
                              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                              : book.extraction_status === 'processing'
                                ? 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/30'
                                : 'bg-green-500/15 text-green-200 border border-green-500/30'
                          }`}
                        >
                          {book.extraction_status || 'completed'}
                        </span>
                        {book.extraction_status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => handleRetryExtraction(book.id)}
                            disabled={retryingBookId === book.id}
                            className="px-3 py-1 border border-yellow-300/40 text-yellow-200 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-yellow-300 hover:text-black transition-colors disabled:opacity-60"
                          >
                            {retryingBookId === book.id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                        <div className="text-center p-2 bg-white/5 hover:bg-white/10 transition-colors">
                          <Eye className="w-3 h-3 mx-auto mb-1 text-gray-500" />
                          <span className="text-[8px] font-black block">{book.views ?? '-'}</span>
                        </div>
                        <div className="text-center p-2 bg-white/5 hover:bg-white/10 transition-colors">
                          <Users className="w-3 h-3 mx-auto mb-1 text-gray-500" />
                          <span className="text-[8px] font-black block">{book.owners ?? '-'}</span>
                        </div>
                        <div className="text-center p-2 bg-white/5 hover:bg-white/10 transition-colors">
                          <BarChart3 className="w-3 h-3 mx-auto mb-1 text-gray-500" />
                          <span className="text-[8px] font-black block">{book.revenue ?? '-'}</span>
                        </div>
                      </div>
                      
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Book Edit Modal */}
      {editingBook && (
        <BookEditModal
          key={editingBook.id}
          book={editingBook}
          onSave={handleSaveBook}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Delete Book Dialog */}
      {deletingBook && (
        <DeleteBookDialog
          book={deletingBook}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingBook(null)}
        />
      )}
    </div>
  );
};

