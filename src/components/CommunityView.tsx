import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Heart, MoreHorizontal, Plus, Zap, Globe,
  Send, Lock, CheckCircle, AlertCircle, X, Bookmark, BellOff, Trash2, Loader2
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { api } from '../services/api';
import { auth } from '../services/auth';
import type { CommunityPost, CommunityPostComment, User } from '../types';

// ─── Category map ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'ყველა', value: 'ALL' },
  { label: 'დისკუსია', value: 'discussion' },
  { label: 'განცხადება', value: 'announcement' },
  { label: 'ხელოვნება', value: 'art' },
  { label: 'ბაზარი', value: 'market' },
];

function formatDate(isoStr: string) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Inline comment section per post ──────────────────────────────────────────
interface CommentSectionProps {
  postId: string | number;
  postAuthorHandle: string;
  isAuthenticated: boolean;
  onLoginRequest: () => void;
  onCommentAdded: () => void;
  maxListHeight?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, postAuthorHandle, isAuthenticated, onLoginRequest, onCommentAdded, maxListHeight }) => {
  const [comments, setComments] = useState<CommunityPostComment[]>([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<CommunityPostComment | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleThread = (id: string | number) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadComments = async (
    page: number = 1,
    append: boolean = false,
    isCancelled?: () => boolean,
  ) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const response = await api.getPostComments(postId, page, 20);
      if (isCancelled?.()) return;
      
      if (append) {
        setComments(prev => [...prev, ...response.results]);
      } else {
        setComments(response.results);
      }
      
      setHasMore(!!response.next);
      setTotalCount(response.count);
      setCurrentPage(page);
    } catch (err: any) {
      if (isCancelled?.()) return;
      setError(err.message || 'COMMENTS_FAILED');
    } finally {
      if (!isCancelled?.()) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await loadComments(1, false, () => cancelled);
    };

    run();
    return () => { cancelled = true; };
  }, [postId]);

  const handleSubmit = async () => {
    if (!isAuthenticated) { onLoginRequest(); return; }
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const newComment = await api.createPostComment(postId, trimmed, replyTo?.id);
      setComments(prev => [...prev, newComment]);
      setText('');
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      onCommentAdded();
    } catch (err: any) {
      setError(err.message || 'COMMENT_FAILED');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const rootComments = comments.filter(c => !c.parent);

  const renderComment = (c: CommunityPostComment, depth: number = 0) => {
    const children = comments.filter(child => child.parent === c.id);
    const isAuthor = c.handle === postAuthorHandle;
    return (
      <motion.div
        key={c.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className={`group relative ${depth > 0 ? 'ml-8 sm:ml-12 mt-4' : 'mt-4'}`}
      >
        {/* Tree branch connector for replies */}
        {depth > 0 && (
          <div className="absolute -left-4 sm:-left-6 top-3 w-3 sm:w-4 h-[2px] bg-white/10" />
        )}
        {/* Vertical line for connecting deep replies if any children exist and are expanded */}
        {children.length > 0 && expandedThreads.has(c.id) && (
          <div className="absolute left-3 sm:left-4 top-10 bottom-[-16px] w-[2px] bg-white/5" />
        )}

        <div className="flex gap-3">
          <div className={`border border-white/10 flex items-center justify-center shrink-0 bg-zinc-900 font-black text-[#FFFF2E] z-10 ${depth > 0 ? 'w-6 h-6 text-[8px] mt-0.5' : 'w-8 h-8 text-[10px]'}`}>
            {c.avatar
              ? <ImageWithFallback src={c.avatar} className="w-full h-full object-cover" alt={c.author} />
              : c.author?.[0]?.toUpperCase() || '?'
            }
          </div>
          <div className="flex-1 space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              {isAuthor && (
                <span className="px-1.5 py-0.5 bg-[#FFFF2E]/20 text-[#FFFF2E] border border-[#FFFF2E]/30 text-[8px] font-black uppercase tracking-widest rounded-sm translate-y-[-1px]">
                  ავტორი
                </span>
              )}
              <span className={`font-black uppercase shrink-0 truncate max-w-[150px] sm:max-w-[200px] ${depth > 0 ? 'text-[9px] text-[#FFFF2E]' : 'text-[10px] text-white'}`}>{c.author}</span>
              <span className="text-[8px] font-black text-gray-700 uppercase ml-auto shrink-0">
                {formatDate(c.createdAt)}
              </span>
            </div>
            <p className={`font-bold text-gray-300 leading-relaxed break-words ${depth > 0 ? 'text-[10px]' : 'text-[11px]'}`}>{c.content}</p>

            <div className="pt-1 flex items-center justify-between overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={() => setReplyTo(c)}
                className="text-[9px] font-black uppercase text-gray-500 hover:text-[#FFFF2E] transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" /> პასუხი
              </button>
            </div>
          </div>
        </div>

        {children.length > 0 && (
          <div className="mt-2 pl-[42px] sm:pl-[52px]">
            <button
              onClick={() => toggleThread(c.id)}
              className="text-[9px] font-black uppercase tracking-widest text-[#FFFF2E] hover:text-white transition-colors flex items-center gap-2 py-1"
            >
              <div className="w-4 h-[1px] bg-[#FFFF2E]/30" />
              {expandedThreads.has(c.id) ? 'დამალვა' : `${children.length} პასუხის ნახვა`}
            </button>
          </div>
        )}

        <AnimatePresence>
          {children.length > 0 && expandedThreads.has(c.id) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-0 overflow-hidden"
            >
              {children.map(child => renderComment(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="border-t border-white/5 mt-6 pt-6 space-y-4 overflow-hidden"
    >
      {/* Comment list */}
      {loading ? (
        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest animate-pulse">
          კომენტარების ჩატვირთვა...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-[9px] font-black uppercase text-gray-700 tracking-widest">
          კომენტარები არ არის — გახდი პირველი!
        </p>
      ) : (
        <div
          className="space-y-4 pr-1"
          style={maxListHeight ? { maxHeight: maxListHeight, overflowY: 'auto' } : undefined}
        >
          {rootComments.map(c => renderComment(c, 0))}
          
          {/* Load More Comments */}
          {hasMore && (
            <div className="pt-4 text-center">
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase text-gray-500">
                  <div className="w-1.5 h-1.5 bg-[#FFFF2E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#FFFF2E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#FFFF2E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <button
                  onClick={() => loadComments(currentPage + 1, true)}
                  className="text-[9px] font-black uppercase text-[#FFFF2E] hover:text-white transition-colors flex items-center gap-2 mx-auto"
                >
                  <span className="w-4 h-[1px] bg-[#FFFF2E]" />
                  ყველა კომენტარის ჩვენება ({comments.length} / {totalCount})
                  <span className="w-4 h-[1px] bg-[#FFFF2E]" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-[9px] font-black uppercase text-red-500"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
            <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose row */}
      <div className="space-y-2">
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#FFFF2E] bg-[#FFFF2E]/10 p-2 border-l-2 border-[#FFFF2E]"
            >
              <MessageSquare className="w-3 h-3" />
              <span>პასუხი @{replyTo.handle}-ს: "{replyTo.content.substring(0, 30)}{replyTo.content.length > 30 ? '...' : ''}"</span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-auto text-[#FFFF2E] hover:text-white transition-colors"
                title="გაუქმება"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 border border-white/10 flex items-center justify-center shrink-0 bg-zinc-900">
            {isAuthenticated
              ? <Plus className="w-3 h-3 text-[#FFFF2E]" />
              : <Lock className="w-3 h-3 text-gray-600" />
            }
          </div>
          <div className="flex-1 flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={!isAuthenticated || submitting}
              placeholder={isAuthenticated ? (replyTo ? 'საპასუხო ტექსტი (Ctrl+Enter)...' : 'კომენტარი (Ctrl+Enter)...') : 'კომენტარისთვის შეიყვანეთ...'}
              className="flex-1 bg-zinc-900 border border-white/10 focus:border-[#FFFF2E] p-2 text-[11px] font-bold uppercase outline-none resize-none transition-all min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
              rows={1}
            />
            {isAuthenticated ? (
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="shrink-0 bg-[#FFFF2E] text-black p-2 hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <span className="animate-spin inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
                  : <Send className="w-3 h-3" />
                }
              </button>
            ) : (
              <button
                onClick={onLoginRequest}
                className="shrink-0 border border-white/10 text-gray-500 px-3 py-2 text-[9px] font-black uppercase hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all"
              >
                შესვლა
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Post Composer ─────────────────────────────────────────────────────────────
interface ComposerProps {
  isAuthenticated: boolean;
  onPost: (post: CommunityPost) => void;
  onLoginRequest: () => void;
}

const PostComposer: React.FC<ComposerProps> = ({ isAuthenticated, onPost, onLoginRequest }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('discussion');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) { onLoginRequest(); return; }
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const newPost = await api.createCommunityPost({ content: trimmed, category });
      onPost(newPost);
      setContent('');
      setSuccess(true);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'POST_FAILED');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950 border-4 border-white p-6 shadow-[10px_10px_0px_0px_rgba(255,255,46,1)]"
    >
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-zinc-900 border-2 border-white/10 flex items-center justify-center shrink-0">
          {isAuthenticated ? <Plus className="w-6 h-6 text-[#FFFF2E]" /> : <Lock className="w-5 h-5 text-gray-600" />}
        </div>
        <div className="flex-1 space-y-4">
          <textarea
            ref={textareaRef}
            id="community-post-input"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={!isAuthenticated || submitting}
            placeholder={isAuthenticated ? 'რა გაქვს სათქმელი?... (Ctrl+Enter)' : 'პოსტირებისთვის გაიარეთ ავტორიზაცია...'}
            className="w-full bg-transparent border-b-2 border-white/10 p-2 text-sm font-black uppercase outline-none focus:border-[#FFFF2E] transition-all resize-none min-h-[96px] disabled:opacity-40 disabled:cursor-not-allowed"
            rows={3}
          />

          {isAuthenticated && (
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c.value !== 'ALL').map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border transition-all ${category === cat.value
                    ? 'bg-[#FFFF2E] text-black border-[#FFFF2E]'
                    : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 border-2 border-red-600/40 bg-red-600/10 px-4 py-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-red-700 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center">
            <div>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-green-500"
                >
                  <CheckCircle className="w-4 h-4" />
                  პოსტი გამოქვეყნდა
                </motion.div>
              )}
            </div>
            {isAuthenticated ? (
              <button
                id="community-post-submit"
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="flex items-center gap-2 bg-[#FFFF2E] text-black px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><span className="animate-spin inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full" />გაგზავნა...</>
                ) : (
                  <><Send className="w-3 h-3" />გამოქვეყნება</>
                )}
              </button>
            ) : (
              <button
                onClick={onLoginRequest}
                className="flex items-center gap-2 border-2 border-white/20 text-gray-400 px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all"
              >
                <Lock className="w-3 h-3" />შესვლა
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Community View ───────────────────────────────────────────────────────
export const CommunityView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // default: ALL
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string | number>>(new Set());
  const [modalPost, setModalPost] = useState<CommunityPost | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string | number, number>>({});
  const [savedPosts, setSavedPosts] = useState<Set<string | number>>(new Set());
  const [mutedPosts, setMutedPosts] = useState<Set<string | number>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPosts = async (page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const [feedResponse, savedData] = await Promise.all([
        api.getCommunityPosts(page, 20),
        isAuthenticated ? api.getSavedCommunityPosts() : Promise.resolve([])
      ]);

      if (append) {
        setPosts(prev => {
          const mergedMap = new Map<string | number, CommunityPost>();

          prev.forEach(p => mergedMap.set(p.id, p));

          (savedData || []).forEach(p => mergedMap.set(p.id, { ...p, is_saved: true }));

          (feedResponse.results || []).forEach(p => {
            if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
          });

          const finalPosts = Array.from(mergedMap.values());
          finalPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return finalPosts;
        });
      } else {
        const mergedMap = new Map<string | number, CommunityPost>();

        (savedData || []).forEach(p => mergedMap.set(p.id, { ...p, is_saved: true }));

        (feedResponse.results || []).forEach(p => {
          if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
        });

        const finalPosts = Array.from(mergedMap.values());
        finalPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setPosts(finalPosts);

        if (page === 1) {
          const counts: Record<string | number, number> = {};
          const savedIds = new Set<string | number>();
          const likedIds = new Set<string | number>();
          finalPosts.forEach(p => {
            counts[p.id] = p.comments;
            if (p.is_saved) savedIds.add(p.id);
            if (p.is_liked) likedIds.add(p.id);
          });
          setCommentCounts(counts);
          setSavedPosts(savedIds);
          setLikedPosts(likedIds);
        }
      }
      setHasMore(!!feedResponse.next);
      setTotalCount(feedResponse.count);
      
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'FEED_OFFLINE');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    auth.getSession().then((user: User | null) => {
      if (cancelled) return;
      setCurrentUser(user);
      setIsAuthenticated(Boolean(user));
    }).catch(() => {
      if (cancelled) return;
      setCurrentUser(null);
      setIsAuthenticated(false);
    }).finally(() => {
      if (!cancelled) setIsAuthLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load posts only once auth has settled to prevent double-fetch
  useEffect(() => {
    if (isAuthLoading) return;
    loadPosts(1, false);
  }, [isAuthenticated, isAuthLoading]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadPosts(currentPage + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, currentPage]);

  useEffect(() => {
    if (modalPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalPost]);

  const handleNewPost = (post: CommunityPost) => {
    setPosts(prev => [post, ...prev]);
    setCommentCounts(prev => ({ ...prev, [post.id]: 0 }));
  };

  const handleLoginRequest = () => navigate('/login');

  const toggleLike = async (postId: string | number) => {
    if (!isAuthenticated) {
      handleLoginRequest();
      return;
    }
    const isCurrentlyLiked = likedPosts.has(postId);

    // Optimistically update
    setLikedPosts(prev => {
      const next = new Set(prev);
      isCurrentlyLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: p.likes + (isCurrentlyLiked ? -1 : 1) } : p
    ));

    try {
      let res;
      if (isCurrentlyLiked) {
        res = await api.unlikeCommunityPost(postId);
      } else {
        res = await api.likeCommunityPost(postId);
      }
      // Re-sync with backend true value
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: res.likes } : p));
    } catch (err) {
      // Revert optimism if failed
      setLikedPosts(prev => {
        const next = new Set(prev);
        isCurrentlyLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes: p.likes + (isCurrentlyLiked ? 1 : -1) } : p
      ));
    }
  };

  const handleCommentAdded = (postId: string | number) => {
    setCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    // We don't need to manually add to recent_comments if they view the modal, 
    // but the modal will self-update since it uses the CommentSection.
  };

  const handleToggleSave = async (id: string | number) => {
    setActiveMenuId(null);
    const isCurrentlySaved = savedPosts.has(id);

    // Optimistic toggle
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await api.unsaveCommunityPost(id);
      } else {
        await api.saveCommunityPost(id);
      }
    } catch (err) {
      // Revert optimism if failed
      setSavedPosts(prev => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(id);
        else next.delete(id);
        return next;
      });
      alert('შეცდომა პოსტის შენახვისას');
    }
  };

  const handleMutePost = (id: string | number) => {
    setMutedPosts(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setActiveMenuId(null);
  };

  const handleDeletePost = async (id: string | number) => {
    if (!window.confirm('ნამდვილად გსურთ პოსტის წაშლა?')) return;
    try {
      await api.deleteCommunityPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      setActiveMenuId(null);
    } catch (err) {
      alert('შეცდომა პოსტის წაშლისას');
    }
  };

  const filteredPosts = posts.filter(p => {
    if (mutedPosts.has(p.id)) return false;
    if (activeTab === 'SAVED') return savedPosts.has(p.id);
    return activeTab === 'ALL' || p.category === activeTab;
  });

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-10 h-10 animate-spin text-white/30" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 animate-pulse">
            იტვირთება...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black font-mono">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left Sidebar ─────────────────────────────────────────── */}
          <div className="w-full lg:w-64 space-y-8">
            <div className="border-l-4 border-[#FFFF2E] pl-6 space-y-2">
              <h1 className="text-4xl font-black uppercase tracking-tighter">ქომუნითი</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">სათემო სივრცე</p>
            </div>

            <div className="space-y-2 pt-8 border-t border-white/10">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveTab(cat.value)}
                  className={`w-full text-left p-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group ${activeTab === cat.value ? 'bg-[#FFFF2E] text-black' : 'hover:bg-white/5 text-gray-500'
                    }`}
                >
                  {cat.label}
                  <Zap className={`w-3 h-3 ${activeTab === cat.value ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>

            {/* Auth status block removed per user request */}
            <div className="p-6 bg-zinc-900 border-2 border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-[#FFFF2E]">
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">სტატისტიკა</span>
              </div>
              <div className="space-y-2 text-[10px] font-black uppercase leading-tight">
                <div className="flex justify-between">
                  <span className="text-gray-500">პოსტები:</span>
                  <span>{totalCount > 0 ? `${posts.length} / ${totalCount}` : posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">სტატუსი:</span>
                  <span className="text-green-500">ონლაინ</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Feed ──────────────────────────────────────────────── */}
          <div className="flex-1 space-y-8">
            <PostComposer
              isAuthenticated={isAuthenticated}
              onPost={handleNewPost}
              onLoginRequest={handleLoginRequest}
            />

            <div className="space-y-6">
              {loading ? (
                <div className="p-12 border-4 border-dashed border-white/10 text-center text-[10px] font-black uppercase tracking-widest text-gray-500 animate-pulse">
                  პოსტები იტვირთება...
                </div>
              ) : error ? (
                <div className="p-12 border-4 border-red-600/20 bg-red-600/5 text-center text-[10px] font-black uppercase tracking-widest text-red-500">
                  შეცდომა: {error}
                </div>
              ) : filteredPosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 border-4 border-dashed border-white/10 text-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">პოსტები ჯერ არ არის</p>
                  {isAuthenticated && (
                    <p className="mt-2 text-[9px] font-black uppercase text-gray-700">პირველი გახდი!</p>
                  )}
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredPosts.map(post => {
                    const commentCount = commentCounts[post.id] ?? post.comments;
                    const liked = likedPosts.has(post.id);
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key={post.id}
                        onClick={() => setModalPost(post)}
                        className="bg-zinc-950 border-2 border-white/5 hover:border-white/20 transition-all p-8 relative group cursor-pointer"
                      >
                        {/* Category + timestamp badge */}
                        <div className="absolute top-0 right-0 bg-white/5 px-3 py-1 text-[8px] font-black uppercase text-gray-600 group-hover:bg-[#FFFF2E] group-hover:text-black transition-colors italic">
                          {post.category} // {formatDate(post.timestamp)}
                        </div>

                        <div className="flex gap-6">
                          {/* Avatar */}
                          <div className="w-16 h-16 border-2 border-white/10 overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                            {post.avatar
                              ? <ImageWithFallback src={post.avatar} className="w-full h-full object-cover" alt={post.author} />
                              : <span className="text-2xl font-black text-[#FFFF2E]">{post.author?.[0]?.toUpperCase() || '?'}</span>
                            }
                          </div>

                          <div className="flex-1 space-y-4">
                            {/* Body */}
                            <p className="text-sm font-bold uppercase leading-relaxed text-gray-300 whitespace-pre-wrap">
                              {post.content}
                            </p>

                            {/* Attached image */}
                            {post.image && (
                              <div className="aspect-[16/9] border-2 border-white/10 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                                <ImageWithFallback src={post.image} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform" alt="post" />
                              </div>
                            )}

                            {/* Action bar */}
                            <div className="flex items-center gap-8 pt-4 border-t border-white/5">
                              {/* Like */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                              >
                                <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
                                {post.likes}
                              </button>

                              {/* Comment stat */}
                              <div
                                className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                {commentCount} კომენტარი
                              </div>

                              {/* Share has been removed per user request */}

                              <div className="relative ml-auto">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === post.id ? null : post.id);
                                  }}
                                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${activeMenuId === post.id ? 'bg-white/10 text-white' : 'text-gray-700 hover:bg-white/5 hover:text-white'}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                <AnimatePresence>
                                  {activeMenuId === post.id && (
                                    <>
                                      {/* Invisible overlay to close dropdown when clicking outside */}
                                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 bottom-full mb-2 w-48 bg-zinc-900 border border-white/10 z-50 shadow-2xl py-2 flex flex-col items-stretch"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button onClick={() => handleToggleSave(post.id)} className="px-4 py-3 text-[10px] font-black uppercase text-left text-gray-400 hover:text-[#FFFF2E] hover:bg-white/5 flex items-center gap-3 transition-colors">
                                          <Bookmark className={`w-3.5 h-3.5 ${savedPosts.has(post.id) ? 'fill-[#FFFF2E] text-[#FFFF2E]' : ''}`} />
                                          {savedPosts.has(post.id) ? 'ამოშლა შენახულებიდან' : 'პოსტის შენახვა'}
                                        </button>

                                        {currentUser?.handle === post.handle ? (
                                          <button onClick={() => handleDeletePost(post.id)} className="px-4 py-3 text-[10px] font-black uppercase text-left text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" /> პოსტის წაშლა
                                          </button>
                                        ) : (
                                          <button onClick={() => handleMutePost(post.id)} className="px-4 py-3 text-[10px] font-black uppercase text-left text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors">
                                            <BellOff className="w-3.5 h-3.5" /> პოსტის დადუმება
                                          </button>
                                        )}
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Recent minimal comments outline (up to 2) */}
                            {post.recent_comments && post.recent_comments.length > 0 && (
                              <div className="pt-4 border-t border-white/5 space-y-2">
                                {post.recent_comments.map(c => (
                                  <div key={c.id} className="flex items-baseline gap-2">
                                    <span className="text-[10px] font-black uppercase text-white">{c.author}</span>
                                    <span className="text-[10px] font-bold text-gray-400">{c.content}</span>
                                  </div>
                                ))}
                                {commentCount > post.recent_comments.length && (
                                  <div className="text-[9px] font-black uppercase text-gray-500 pt-1 group-hover:text-[#FFFF2E] transition-colors">
                                    იხილეთ ყველა {commentCount} კომენტარი...
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              
              {/* Load More Trigger */}
              {!loading && !error && filteredPosts.length > 0 && (
                <div ref={loadMoreRef} className="py-8 text-center">
                  {loadingMore ? (
                    <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase text-gray-500 animate-pulse">
                      <div className="w-2 h-2 bg-[#FFFF2E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#FFFF2E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#FFFF2E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="ml-2">პოსტების ჩატვირთვა...</span>
                    </div>
                  ) : hasMore ? (
                    <div className="h-12" /> /* Spacer for intersection observer */
                  ) : (
                    <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest">
                      ყველა პოსტი ნაჩვენებია ({filteredPosts.length})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Sidebar ───────────────────────────────────────────── */}
          <div className="hidden xl:block w-72 space-y-8">
            {/* Saved Posts Block */}
            <div className="p-8 border-2 border-white/5 bg-zinc-900 space-y-6">
              <h4 className="text-sm font-black uppercase italic border-b-2 border-white/10 pb-4 text-[#FFFF2E]">შენახული პოსტები</h4>
              <button
                onClick={() => setActiveTab('SAVED')}
                className={`w-full flex items-center justify-between p-4 border text-[10px] font-black uppercase transition-all ${activeTab === 'SAVED' ? 'border-[#FFFF2E] bg-[#FFFF2E]/10 text-[#FFFF2E]' : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'}`}
              >
                <div className="flex items-center gap-2">
                  <Bookmark className={`w-4 h-4 ${activeTab === 'SAVED' ? 'fill-[#FFFF2E]' : ''}`} />
                  შენახული პოსტები
                </div>
                {savedPosts.size > 0 && (
                  <span className="bg-[#FFFF2E] text-black px-2 py-0.5 rounded-full">{savedPosts.size}</span>
                )}
              </button>
            </div>

            {!isAuthLoading && !isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-2 border-[#FFFF2E]/20 bg-[#FFFF2E]/5 space-y-4"
              >
                <div className="text-[10px] font-black uppercase text-[#FFFF2E] tracking-widest">გახდი წევრი</div>
                <div className="text-[9px] font-black uppercase text-gray-500 leading-loose space-y-2">
                  <p>1. გაიარეთ ავტორიზაცია</p>
                  <p>2. დაწერეთ თქვენი პოსტი</p>
                  <p>3. დააჭირეთ „გამოქვეყნება"</p>
                </div>
                <button
                  onClick={handleLoginRequest}
                  className="w-full bg-[#FFFF2E] text-black py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all"
                >
                  შესვლა ახლა
                </button>
              </motion.div>
            )}

          </div>

        </div>
      </div>

      {/* ── Post Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden"
            onClick={() => setModalPost(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-4 border-[#FFFF2E] p-8 relative shadow-[0_0_40px_rgba(255,255,46,0.15)] overscroll-contain custom-scrollbar"
            >
              {/* Close Button */}
              <button
                onClick={() => setModalPost(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-[#FFFF2E] hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-6 mb-8">
                <div className="w-16 h-16 border-2 border-white/10 overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center grayscale">
                  {modalPost.avatar
                    ? <ImageWithFallback src={modalPost.avatar} className="w-full h-full object-cover" alt={modalPost.author} />
                    : <span className="text-2xl font-black text-[#FFFF2E]">{modalPost.author?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <div className="flex-1 space-y-4 pr-8">
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black uppercase leading-none">{modalPost.author}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-[#FFFF2E] uppercase tracking-widest">@{modalPost.handle}</span>
                      <span className="text-[10px] font-black text-gray-600 uppercase">/ {formatDate(modalPost.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold uppercase leading-relaxed text-gray-300 whitespace-pre-wrap">
                    {modalPost.content}
                  </p>
                  {modalPost.image && (
                    <div className="aspect-[16/9] border-2 border-white/10 overflow-hidden grayscale">
                      <ImageWithFallback src={modalPost.image} className="w-full h-full object-cover" alt="post" />
                    </div>
                  )}
                </div>
              </div>

              {/* Full Comment Section */}
              <div className="mt-8 pt-8">
                <h4 className="text-sm font-black uppercase italic mb-6 text-[#FFFF2E]">კომენტარები ({commentCounts[modalPost.id] ?? modalPost.comments})</h4>
                <CommentSection
                  postId={modalPost.id}
                  postAuthorHandle={modalPost.handle}
                  isAuthenticated={isAuthenticated}
                  onLoginRequest={handleLoginRequest}
                  onCommentAdded={() => handleCommentAdded(modalPost.id)}
                  maxListHeight="35vh"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
