import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, Menu, ArrowRight, X, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, User, Database, BookOpen, ThumbsUp, ThumbsDown } from 'lucide-react';
import Slider from 'react-slick';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { StarRating } from './components/StarRating';
import { LoadingSpinner, PageLoader, BookCardSkeleton, ArchiveBookSkeleton, FeaturedBookSkeleton, ReviewCardSkeleton } from './components/LoadingSpinner';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { BookPage } from './components/BookPage';
import ProfilePage from './pages/Profile';
import { WalletView } from './components/WalletView';
import { UploadBookView } from './components/UploadBookView';
import { LibraryView } from './components/LibraryView';
import { MyBooksView } from './components/MyBooksView';
import { BookDraftView } from './components/BookDraftView';
import { CommunityView } from './components/CommunityView';
import { ReaderView } from './components/ReaderView';
import { api } from './services/api';
import { auth } from './services/auth';
import type { Book, Review, User as AppUser } from './types';

// --- Sub-Components ---

const Navbar = ({ onNavigate, user, onSignOut, searchQuery, onSearchChange, cartCount, onOpenCart }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'მთავარი' },
    { id: 'books', label: 'წიგნები' },
    { id: 'community', label: 'ქომუნითი' },
    { id: 'reviews', label: 'შეფასებები' },
  ];

  const userItems = [
    { id: 'profile', label: 'პროფილი', icon: User },
    { id: 'wallet', label: 'საფულე', icon: ShoppingBag },
    { id: 'library', label: 'შენაძენი', icon: Database },
    { id: 'my-books', label: 'ჩემი წიგნები', icon: BookOpen },
    { id: 'upload-book', label: 'ატვირთვა', icon: Plus },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 md:px-6 py-4 border-b-2 border-white/10 bg-black/95 backdrop-blur-xl font-mono">
        <div className="flex items-center gap-4 lg:gap-12">
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.1em] uppercase leading-none cursor-pointer text-white hover:text-[#FFFF2E] transition-colors" onClick={() => onNavigate('home')}>INK SLAB</h1>
          <div className="hidden lg:flex gap-8">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => onNavigate(item.id as any)} className="text-xs font-black uppercase tracking-widest hover:line-through transition-all cursor-pointer text-white">{item.label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden lg:flex items-center gap-6 mr-4 border-r-2 border-white/10 pr-6">
            {user ? (
              <div className="relative">
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1 border-2 border-white/20 bg-white/5 hover:border-[#FFFF2E] transition-all cursor-pointer group"
                >
                  <div className="w-2 h-2 bg-[#FFFF2E] rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-[#FFFF2E]">
                    {user?.name || user?.handle || user?.email || 'წევრის_ID_X'}
                  </span>
                  <ChevronRight className={`w-3 h-3 text-white transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-black border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,46,1)] z-20 overflow-hidden"
                      >
                        <div className="bg-[#FFFF2E] text-black px-4 py-2 text-[9px] font-black uppercase flex justify-between items-center">
                          <span>დამხმარე მენიუ</span>
                          <span className="animate-pulse">●</span>
                        </div>
                        
                        <div className="p-2 space-y-1 bg-black">
                          {userItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                onNavigate(item.id as any);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-4 px-4 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-[#FFFF2E] hover:text-black transition-all text-left group border border-transparent hover:border-white/20"
                            >
                              <item.icon className="w-4 h-4 text-[#FFFF2E] group-hover:text-black transition-colors" />
                              <span className="text-white group-hover:text-black">{item.label}</span>
                            </button>
                          ))}
                          
                          <div className="h-[2px] bg-white/10 my-2" />
                          
                          <button
                            onClick={() => {
                              onSignOut();
                              setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-4 px-4 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all text-left group text-gray-500 border border-transparent"
                          >
                            <X className="w-4 h-4 text-red-600 group-hover:text-white transition-colors" />
                            <span className="group-hover:text-white">[ გასვლა ]</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('login')}
                  className="text-[10px] font-black uppercase tracking-widest hover:text-[#FFFF2E] transition-colors cursor-pointer text-white"
                >
                  შესვლა
                </button>
                <button 
                  onClick={() => onNavigate('register')}
                  className="bg-[#FFFF2E] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors cursor-pointer"
                >
                  რეგისტრაცია
                </button>
              </>
            )}
          </div>
          <div className="hidden md:flex items-center bg-white/5 border-2 border-white/10 px-4 py-2 group focus-within:border-[#FFFF2E] transition-all">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="იპოვე სიმართლე..."
              className="bg-transparent text-[11px] font-black uppercase outline-none w-24 lg:w-32 placeholder:text-gray-600 tracking-widest text-white" 
            />
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#FFFF2E] transition-colors" />
          </div>
          <div className="relative cursor-pointer group" onClick={onOpenCart}>
            <ShoppingBag className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FFFF2E] text-black text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1 text-white hover:text-[#FFFF2E] transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-zinc-950 border-l-4 border-[#FFFF2E] z-[110] flex flex-col lg:hidden"
            >
              <div className="p-6 border-b-2 border-white/10 flex justify-between items-center bg-black">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">მართვის ცენტრი</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 border-2 border-white/20 hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-12">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-[#FFFF2E] uppercase tracking-[0.4em] mb-4 block">ნავიგაცია</span>
                  <div className="grid gap-2">
                    {menuItems.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => {
                          onNavigate(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full p-4 border-2 border-white/5 bg-black text-left text-lg font-black uppercase hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-[#FFFF2E] uppercase tracking-[0.4em] mb-4 block">მომხმარებლის პროტოკოლი</span>
                  {user ? (
                    <div className="grid gap-2">
                      {userItems.map(item => (
                        <button 
                          key={item.id} 
                          onClick={() => {
                            onNavigate(item.id as any);
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full p-4 border-2 border-white/5 bg-black flex items-center gap-4 text-sm font-black uppercase hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all"
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </button>
                      ))}
                       <button 
                         onClick={() => {
                           onSignOut();
                           setIsMobileMenuOpen(false);
                         }}
                         className="w-full p-4 border-2 border-red-600/20 bg-black flex items-center gap-4 text-sm font-black uppercase text-red-600 hover:bg-red-600 hover:text-white transition-all mt-4"
                       >
                         <X className="w-5 h-5" />
                         გასვლა
                       </button>
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => onNavigate('login')} className="p-4 border-2 border-white/20 font-black uppercase text-xs hover:border-[#FFFF2E] transition-all">შესვლა</button>
                       <button onClick={() => onNavigate('register')} className="p-4 bg-[#FFFF2E] text-black font-black uppercase text-xs">რეგისტრაცია</button>
                     </div>
                   )}
                 </div>

                <div className="pt-8 border-t border-white/5">
                   <div className="flex items-center bg-black border-2 border-white/10 px-4 py-3 group focus-within:border-[#FFFF2E] transition-all">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
              placeholder="იპოვე სიმართლე..."
                      className="bg-transparent text-sm font-black uppercase outline-none flex-1 placeholder:text-gray-800 tracking-widest text-white" 
                    />
                    <Search className="w-5 h-5 text-gray-800 group-focus-within:text-[#FFFF2E]" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-black border-t-2 border-white/10">
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  სადგური აქტიურია // 404_SYND
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const CartSidebar = ({ isOpen, onClose, cart, onRemove, onExecuteOrder, isExecuting, executeError }) => {
  const total = cart.reduce((acc, item) => {
    const price = parseFloat(item.book.price.replace('£', '')) || 0;
    return acc + price;
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l-4 border-white z-[80] flex flex-col shadow-[-20px_0px_60px_rgba(0,0,0,0.8)]"
          >
            <div className="p-8 border-b-4 border-white flex justify-between items-center bg-black">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">კალათა</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 border-2 border-white flex items-center justify-center hover:bg-[#FFFF2E] hover:text-black transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 grayscale">
                  <ShoppingBag className="w-20 h-20" />
                  <p className="text-sm font-black uppercase tracking-[0.4em] text-center leading-loose">
                    კალათა ცარიელია.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.book.id} className="group relative flex gap-6 p-4 border-2 border-white/5 hover:border-white transition-all bg-black">
                    <div className="w-24 aspect-[3/4] border-2 border-white overflow-hidden bg-zinc-900">
                      <ImageWithFallback src={item.book.img || item.book.cover_image_url || ''} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all" alt={item.book.title} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-black uppercase leading-none text-white">{item.book.title}</h3>
                          <button onClick={() => onRemove(item.book.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[10px] font-black text-[#FFFF2E] uppercase tracking-widest">{item.book.author}</span>
                      </div>
                      <div className="flex justify-between items-end pt-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">რაოდ: 1</div>
                        <span className="text-xl font-black text-white">{item.book.price}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-black border-t-4 border-white space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">ჯამური_საფასური</span>
                  <span className="text-5xl font-black text-[#FFFF2E]">£{total.toFixed(2)}</span>
                </div>
                {executeError && (
                  <div className="border-2 border-red-600/50 bg-red-600/10 text-red-500 px-4 py-3 text-[9px] font-black uppercase tracking-widest">
                    გადახდის_შეცდომა: {executeError}
                  </div>
                )}
                <button
                  className="w-full bg-[#FFFF2E] text-black py-6 text-xl font-black uppercase tracking-tighter hover:bg-white transition-all flex items-center justify-center gap-4 group disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={onExecuteOrder}
                  disabled={isExecuting}
                >
                  {isExecuting ? 'შეკვეთა_იტვირთება...' : 'შეკვეთის_განხორციელება'}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-700 text-center leading-relaxed">
                  გაგრძელებით, თქვენ ეთანხმებით სინდიკატის პროტოკოლებს. <br />
                  ყველა გაყიდვა საბოლოოა.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const BookCard = React.forwardRef(({ title, author, price, img, cover_image_url, tag, oldPrice, onClick, onAddToCart }, ref) => (
  <motion.div 
    ref={ref}
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    whileHover={{ y: -10 }}
    className="group cursor-pointer w-full"
  >
    <div className="relative aspect-[3/4] mb-6 overflow-hidden border-2 border-white/5 grayscale group-hover:grayscale-0 transition-all duration-700" onClick={onClick}>
      <ImageWithFallback src={img || cover_image_url || ''} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" alt={title} />
      <div className="absolute inset-0 bg-black/40 opacity-100 group-hover:opacity-0 transition-opacity" />
      {tag && (
        <div className={`absolute top-4 left-4 px-3 py-1 text-[10px] font-black uppercase -rotate-6 group-hover:rotate-0 transition-transform z-10 ${
          tag === 'FREE' ? 'bg-[#FFFF2E] text-black' : 
          tag === 'SALE' ? 'bg-red-600 text-white' : 'bg-[#FFFF2E] text-black'
        }`}>
          {tag}
        </div>
      )}
      <div className="absolute bottom-4 right-4 bg-white text-black px-3 py-1 text-xs font-black italic">
        {oldPrice && <span className="line-through text-gray-400 mr-2">{oldPrice}</span>}
        {price}
      </div>
    </div>
    <div className="space-y-1">
      <div onClick={onClick}>
        <span className="text-[10px] font-black text-[#FFFF2E] uppercase tracking-[0.2em]">{author}</span>
        <h3 className="text-2xl font-black uppercase leading-none group-hover:text-[#FFFF2E] transition-colors">{title}</h3>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart();
        }}
        className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase text-gray-600 hover:text-[#FFFF2E] transition-colors group/btn"
      >
        <span className="w-8 h-[2px] bg-[#FFFF2E] group-hover/btn:w-12 transition-all" />
        კალათაში დამატება
      </button>
    </div>
  </motion.div>
));

// --- Pages ---

const HomePage = ({ onNavigate, onBookClick, featuredBooks, archiveBooks, catalogError, isLoading }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    arrows: false,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
    customPaging: i => (
      <div className={`w-8 h-1 mt-12 transition-all hover:bg-[#FFFF2E] ${currentSlide === i ? 'bg-[#FFFF2E]' : 'bg-white/20'}`} />
    )
  };

  const sliderRef = React.useRef<Slider | null>(null);
  const hasFeatured = featuredBooks.length > 0;
  const hasArchive = archiveBooks.length > 0;

  const CustomPrevArrow = (props: any) => {
    const { onClick } = props;
    return (
      <button 
        onClick={onClick}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-white text-black flex items-center justify-center hover:bg-[#FFFF2E] transition-colors brutal-btn cursor-pointer md:hidden"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
    );
  };

  const CustomNextArrow = (props: any) => {
    const { onClick } = props;
    return (
      <button 
        onClick={onClick}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-white text-black flex items-center justify-center hover:bg-[#FFFF2E] transition-colors brutal-btn cursor-pointer md:hidden"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    );
  };

  return (
    <>
      <section className="relative min-h-[600px] lg:h-screen lg:min-h-[750px] bg-black overflow-hidden flex flex-col justify-center pt-24 pb-20 lg:pt-20">
        <style>{`
          /* Slick Structural Styles */
          .slick-slider { position: relative; display: block; box-sizing: border-box; user-select: none; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
          .slick-list { position: relative; display: block; overflow: hidden; margin: 0; padding: 0; }
          .slick-list:focus { outline: none; }
          .slick-track { position: relative; top: 0; left: 0; display: block; margin-left: auto; margin-right: auto; }
          .slick-track:after { clear: both; display: table; content: ''; }
          .slick-slide { display: none; float: left; height: 100%; min-height: 1px; outline: none; }
          .slick-initialized .slick-slide { display: block; }
          
          /* Custom Syndicate Theme */
          .slick-dots { display: flex !important; gap: 10px; bottom: 40px !important; list-style: none; padding: 0; justify-content: center; width: 100%; }
          .slick-dots li { width: auto; height: auto; margin: 0; cursor: pointer; }
          .slick-dots li button { display: none; }
          .slick-dots li.slick-active div { background-color: #FFFF2E; width: 48px; }
          .slick-slide { outline: none; }
          .slick-list { overflow: visible !important; }

          @keyframes glitch-flash {
            0% { opacity: 0.5; transform: scale(1); filter: hue-rotate(0deg); }
            50% { opacity: 1; transform: scale(1.02); filter: hue-rotate(90deg) invert(1); }
            100% { opacity: 0.5; transform: scale(1); filter: hue-rotate(0deg); }
          }
          .glitch-overlay { animation: glitch-flash 0.3s ease-in-out; }
          
          .featured-slider .slick-list { overflow: visible !important; }
          .featured-slider .slick-slide { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); opacity: 0.3; transform: scale(0.8) rotate(-2deg); filter: grayscale(1); }
          .featured-slider .slick-center { opacity: 1; transform: scale(1.05) rotate(0deg); filter: grayscale(0); z-index: 10; }
          .brutal-btn { clip-path: polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%); }
          
          @keyframes scan {
            from { transform: translateY(-100%); }
            to { transform: translateY(500%); }
          }
          .animate-scan {
            animation: scan 2s linear infinite;
          }
        `}</style>
        
        {/* High-Contrast Dynamic Background */}
        <div className="absolute inset-0 z-0 bg-zinc-950">
          <AnimatePresence mode="popLayout">
            {hasFeatured && (
              <motion.div
                key={`bg-${currentSlide}`}
                initial={{ opacity: 0, filter: 'grayscale(1) brightness(0)' }}
                animate={{ opacity: 0.5, filter: 'grayscale(1) brightness(0.8) contrast(1.5)' }}
                exit={{ opacity: 0, filter: 'grayscale(1) brightness(0)' }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="absolute inset-0"
              >
                <ImageWithFallback 
                  src={featuredBooks[currentSlide]?.img || featuredBooks[currentSlide]?.cover_image_url || ''} 
                  className="w-full h-full object-cover mix-blend-screen" 
                  alt="Dynamic Background"
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Static Zine Overlays */}
          <div className="absolute inset-0 opacity-20 grayscale contrast-200 pointer-events-none mix-blend-overlay">
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1698913463089-6c95fd110e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" 
              className="w-full h-full object-cover" 
              alt="Texture"
            />
          </div>
          
          {/* Brutalist Gradient Cage */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)]" />
          
          {/* Subtle Halftone Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          {catalogError && (
            <div className="mb-10 border-2 border-red-600/40 bg-red-600/10 text-red-500 p-4 text-[10px] font-black uppercase tracking-widest">
              CATALOG_ERROR: {catalogError}
            </div>
          )}
          {isLoading ? (
            <div className="min-h-[500px] flex items-center justify-center">
              <PageLoader message="რჩეული იტვირთება..." />
            </div>
          ) : hasFeatured ? (
            <Slider {...settings}>
              {featuredBooks.map((book, idx) => (
                <div key={book.id} className="outline-none">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Book Object Column */}
                    <div className="col-span-12 lg:col-span-6 flex justify-center lg:justify-start">
                      <motion.div 
                        initial={{ rotate: 10, x: -100, opacity: 0 }}
                        animate={{ rotate: -5, x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        whileHover={{ rotate: 0, scale: 1.02 }}
                        className="relative w-full max-w-[400px] aspect-[3/4] group cursor-pointer"
                        onClick={() => onBookClick(book)}
                      >
                        {/* Industrial Shadow */}
                        <div className="absolute inset-0 bg-[#FFFF2E] translate-x-6 translate-y-6 -z-10 transition-transform group-hover:translate-x-4 group-hover:translate-y-4" />
                        
                        {/* Book Cover */}
                        <div className="w-full h-full border-4 border-white overflow-hidden bg-zinc-900">
                          <ImageWithFallback 
src={book.img || book.coverUrl || book.cover_image_url || ''}
                            className="w-full h-full object-cover grayscale brightness-110 group-hover:grayscale-0 transition-all duration-1000" 
                            alt={book.title} 
                          />
                        </div>
                        
                        {/* Identification Tag */}
                        <div className="absolute -top-4 -right-4 bg-black text-[#FFFF2E] border-2 border-[#FFFF2E] px-4 py-1 text-[10px] font-black uppercase tracking-widest -rotate-12 group-hover:rotate-0 transition-transform">
                          PRIORITY_ASSET_0{idx + 1}
                        </div>
                      </motion.div>
                    </div>

                    {/* Content Column */}
                    <div className="col-span-12 lg:col-span-6 space-y-8">
                      <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-4 text-[#FFFF2E]">
                          <span className="w-12 h-1 bg-[#FFFF2E]" />
                          <span className="text-xs font-black uppercase tracking-[0.5em]">პოპულარული</span>
                        </div>
                        <h2 className="text-5xl md:text-6xl lg:text-[8vw] font-black uppercase leading-[0.8] tracking-tighter">
                          {book.title}
                        </h2>
                        <p className="text-xl font-black uppercase italic text-gray-500">
                          {book.author}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="pt-4"
                      >
                        <button 
                          onClick={() => onBookClick(book)}
                          className="group relative bg-white text-black px-12 py-5 font-black uppercase text-xl overflow-hidden"
                        >
                          <span className="relative z-10 flex items-center gap-4">
                            გაიგე მეტი <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                          </span>
                          <div className="absolute inset-0 bg-[#FFFF2E] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <div className="border-4 border-dashed border-white/10 p-20 text-center">
              <h3 className="text-3xl font-black uppercase text-gray-500">არქივი გათიშულია</h3>
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-600">დაუკავშირდით სერვერს</p>
            </div>
          )}
        </div>

        {/* Ticker bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#FFFF2E] h-14 flex items-center overflow-hidden border-t-4 border-black z-20">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-black font-black uppercase tracking-tighter text-sm mx-12">
                ★ მთელს მსოფლიოში გზავნილი ★ მხოლოდ ანალოგური ★ დამოუკიდებელი პრესა ★ ალგორითმები არ არის ★ სუფთა_მელანი ★ ბრუტალისტური_დიზაინი ★
              </span>
            ))}
          </div>
        </div>
      </section>

    <section className="bg-black py-32 border-b-8 border-[#FFFF2E] relative overflow-hidden">
      <style>{`
        .featured-slider .slick-list { overflow: visible !important; }
        .featured-slider .slick-slide { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); opacity: 0.3; transform: scale(0.8) rotate(-2deg); filter: grayscale(1); }
        .featured-slider .slick-center { opacity: 1; transform: scale(1.05) rotate(0deg); filter: grayscale(0); z-index: 10; }
        .brutal-btn { clip-path: polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%); }
      `}</style>
      
      {/* Background Industrial Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-9xl font-black">01</div>
        <div className="absolute bottom-10 right-10 text-9xl font-black">04</div>
        <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #333 0, #333 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
      </div>

      <div className="container mx-auto px-6 mb-12 md:mb-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="border-l-4 md:border-l-8 border-[#FFFF2E] pl-4 md:pl-8">
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.75]">
              რჩეული<br />
              <span className="text-[#FFFF2E]">არქივი</span>
            </h2>
            <div className="flex items-center gap-4 mt-6">
              <span className="bg-[#FFFF2E] text-black text-[10px] font-black px-2 py-0.5 uppercase">დადასტურებული მარაგი</span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">აირჩიეთ კომპონენტი ანალიზისთვის</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => sliderRef.current?.slickPrev()}
              className="w-16 h-16 bg-white text-black flex items-center justify-center hover:bg-[#FFFF2E] transition-colors brutal-btn cursor-pointer"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button 
              onClick={() => sliderRef.current?.slickNext()}
              className="w-16 h-16 bg-white text-black flex items-center justify-center hover:bg-[#FFFF2E] transition-colors brutal-btn cursor-pointer"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      <div className="featured-slider px-4 md:px-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="არქივი იტვირთება..." />
          </div>
        ) : hasArchive ? (
          <Slider 
            ref={sliderRef}
            dots={false}
            infinite={true}
            speed={600}
            slidesToShow={3}
            slidesToScroll={1}
            centerMode={true}
            centerPadding="0"
            prevArrow={<CustomPrevArrow />}
            nextArrow={<CustomNextArrow />}
            responsive={[
              { breakpoint: 1024, settings: { slidesToShow: 2 } },
              { breakpoint: 640, settings: { slidesToShow: 1 } }
            ]}
          >
            {archiveBooks.map((book, i) => (
              <div key={i} className="px-6 py-12">
                <div 
                  onClick={() => onBookClick(book)}
                  className="relative bg-zinc-900 border-4 border-white group cursor-pointer transition-all duration-500 hover:border-[#FFFF2E]"
                >
                  {/* Header Strip */}
                    <div className="h-8 bg-white group-hover:bg-[#FFFF2E] flex items-center justify-between px-4 transition-colors">
                      <span className="text-[10px] font-black text-black">ფაილის ID: {book.id}</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-black rounded-full" />
                      <div className="w-2 h-2 bg-black rounded-full opacity-30" />
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="relative aspect-[3/4] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 p-4">
                     <div className="absolute inset-4 border-2 border-white/10 z-10 pointer-events-none" />
                     <ImageWithFallback src={book.img || book.coverUrl || book.cover_image_url || ''} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt={book.title} />
                     
                     {/* Scanning Line Effect */}
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFFF2E]/10 to-transparent h-20 w-full -translate-y-full group-hover:animate-scan z-20" />
                  </div>

                  {/* Info Block */}
                  <div className="p-6 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-3xl font-black uppercase leading-none tracking-tighter group-hover:text-[#FFFF2E] transition-colors">
                        {book.title}
                      </h3>
                      <span className="text-2xl font-black italic">{book.price}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                      ავტ_ხელმ: {book.author}
                    </p>
                    
                    {/* Action Bar */}
                    <div className="pt-4 flex items-center justify-between border-t border-white/10">
                      <span className="text-[8px] font-black uppercase text-[#FFFF2E]">კატ: {book.category || 'უცნობი'}</span>
                      <div className="flex items-center gap-2 group/btn">
                        <span className="text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">ასლის მოთხოვნა</span>
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFFF2E] -z-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-white -z-10 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform" />
                </div>
              </div>
            ))}
          </Slider>
        ) : !isLoading && (
          <div className="mx-6 border-4 border-dashed border-white/10 p-20 text-center">
            <h3 className="text-2xl font-black uppercase text-gray-500">არქივის სიგნალი არ არის</h3>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-600">დაუკავშირდით სერვერს</p>
          </div>
        )}
      </div>

      <div className="mt-12 container mx-auto px-6">
        <div className="flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-white/10" />
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">რჩეული ნაკადის დასასრული</div>
          <div className="h-[2px] flex-1 bg-white/10" />
        </div>
      </div>
    </section>

    <section className="bg-black py-20 relative overflow-hidden">
      {/* Texture Overlays - Darker & Grittier */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply z-50 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute inset-0 opacity-5 pointer-events-none z-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col gap-0 relative">
          
          {/* Giant Background Header - Now Outlined/Ghosted */}
          <div className="absolute -top-32 -right-10 z-0 select-none pointer-events-none">
            <h2 className="text-[30vw] font-black text-white/[0.02] uppercase leading-none rotate-6 tracking-tighter" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)', color: 'transparent' }}>
              SIGNAL
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-[#FFFF2E] bg-black relative shadow-[30px_30px_0px_0px_rgba(255,255,46,0.05)]">
            
            {/* Left Header Block - 50% Symmetry */}
            <div className="border-b-4 md:border-b-0 md:border-r-4 border-[#FFFF2E] p-8 md:p-12 flex flex-col justify-between bg-zinc-950 relative overflow-hidden">
              {/* Caution Stripe Background */}
              <div className="absolute top-0 left-0 w-full h-3 bg-[#FFFF2E] opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, black 15px, black 30px)' }} />
              
              <div className="relative z-10 pt-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-[#FFFF2E] uppercase tracking-[0.4em]">კავშირი დამყარებულია</span>
                </div>
                <h2 className="text-6xl lg:text-8xl font-black uppercase leading-[0.75] tracking-tighter mb-8">
                  დაიწყეთ<br />
                  <span className="text-[#FFFF2E]">გადაცემა</span><br />
                  .
                </h2>
                
                <div className="space-y-4 max-w-sm">
                  <div className="h-1 w-16 bg-[#FFFF2E]" />
                  <p className="text-xs font-bold uppercase text-gray-400 leading-relaxed tracking-tight">
                    ანონიმური ნოდის რაუტინგი აქტიურია. კოლექტიურ არქივში კვალი არ რჩება.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6 relative z-10 mt-8">
                  <div className="p-4 border-2 border-[#FFFF2E]/20 bg-black/80 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-black uppercase text-[#FFFF2E] tracking-widest">სიგნალის სიძლიერე</p>
                      <span className="text-[9px] font-black text-green-500">მაქს</span>
                    </div>
                  <div className="flex gap-1 h-6 items-end">
                    {[...Array(16)].map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-[#FFFF2E] opacity-20" 
                        style={{ height: `${20 + Math.random() * 80}%`, animation: `pulse-bar ${1 + Math.random()}s infinite alternate` }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Block - 50% Symmetry */}
            <div className="p-8 md:p-12 relative bg-black text-white flex flex-col justify-center">
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-12 h-12 border-4 border-[#FFFF2E] flex items-center justify-center bg-[#FFFF2E]/5">
                    <Plus className="w-6 h-6 text-[#FFFF2E]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase leading-none">ახალი სიგნალი</h3>
                    <p className="text-[9px] font-bold text-[#FFFF2E] uppercase tracking-[0.2em] mt-1">REF: 404-SYND</p>
                  </div>
                </div>

                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-6">
                    <div className="group relative">
                      <input 
                        type="text" 
                        required
                        className="w-full bg-transparent border-b-2 border-white/20 p-3 font-black uppercase text-xl focus:outline-none focus:border-[#FFFF2E] focus:bg-[#FFFF2E]/5 transition-all placeholder:text-zinc-800"
                        placeholder="იდენტიფიკატორი"
                      />
                      <label className="block text-[9px] font-black uppercase text-gray-500 mt-2 tracking-widest group-focus-within:text-[#FFFF2E]">გამომგზავნის ID</label>
                    </div>

                    <div className="group relative">
                      <input 
                        type="email" 
                        required
                        className="w-full bg-transparent border-b-2 border-white/20 p-3 font-black uppercase text-xl focus:outline-none focus:border-[#FFFF2E] focus:bg-[#FFFF2E]/5 transition-all placeholder:text-zinc-800"
                        placeholder="ამომავლი"
                      />
                      <label className="block text-[9px] font-black uppercase text-gray-500 mt-2 tracking-widest group-focus-within:text-[#FFFF2E]">დაბრუნების გზა</label>
                    </div>

                    <div className="group relative">
                      <textarea 
                        rows={2}
                        required
                        className="w-full bg-transparent border-b-2 border-white/20 p-3 font-black uppercase text-xl focus:outline-none focus:border-[#FFFF2E] focus:bg-[#FFFF2E]/5 transition-all placeholder:text-zinc-800 resize-none"
                        placeholder="მანიფესტი..."
                      />
                      <label className="block text-[9px] font-black uppercase text-gray-500 mt-2 tracking-widest group-focus-within:text-[#FFFF2E]">მონაცემთა ნაკადი</label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="w-full bg-[#FFFF2E] text-black px-8 py-5 text-2xl font-black uppercase hover:bg-white transition-all cursor-pointer flex items-center justify-between group overflow-hidden relative border-4 border-[#FFFF2E]">
                      <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      <span className="relative z-10 flex items-center gap-4">
                        <div className="w-2 h-2 bg-black rounded-full group-hover:scale-150 transition-transform" />
                        გაუშვით
                      </span>
                      <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform relative z-10" />
                    </button>
                    
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex gap-1">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className={`w-1.5 h-2.5 ${i < 6 ? 'bg-[#FFFF2E]' : 'bg-white/10'}`} />
                        ))}
                      </div>
                      <span className="text-[8px] font-black uppercase text-gray-600 tracking-[0.2em]">სიგნალის ბლოკირება აქტიურია</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          {/* Bottom Industrial Info Bar */}
          <div className="w-full bg-zinc-950 border-x-4 border-b-4 border-[#FFFF2E] p-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-8 shrink-0">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-[#FFFF2E] font-black uppercase text-[10px] tracking-widest opacity-50">SYNC_ACTIVE_{i}</span>
                    <div className="w-1 h-1 bg-[#FFFF2E] rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-8 items-center">
              <div className="h-2 w-24 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFFF2E] w-3/4 animate-pulse" />
              </div>
              <span className="text-white font-black uppercase text-[10px] tracking-widest opacity-30">V.404_BUILD</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </section>
  </>
  );
};

const BooksPage = ({ onBookClick, searchQuery, books, onAddToCart, catalogError, isLoading }) => {
  const [filter, setFilter] = useState('ყველა');
  const categories = ['ყველა', 'ზინები', 'წიგნები', 'ესსეები', 'ხელოვნება', 'არქივი'];
  
  const filteredBooks = books.filter(book => {
    const matchesFilter = filter === 'ყველა' || book.category === filter;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="pt-32 pb-32 px-6">
      <div className="container mx-auto">
        <header className="mb-12 md:mb-20">
          <div className="flex items-center gap-4 text-[#FFFF2E] font-black uppercase text-xs tracking-widest mb-4">
            <span className="w-12 h-[2px] bg-[#FFFF2E]" />
            კოლექტიური ბიბლიოთეკა
          </div>
          <h2 className="text-6xl md:text-8xl lg:text-[12vw] font-black uppercase leading-[0.8] tracking-tighter">კატალოგი</h2>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-16 border-y border-white/10 py-8">
          <div className="flex items-center gap-2 mr-8">
            <SlidersHorizontal className="w-5 h-5 text-[#FFFF2E]" />
            <span className="font-black uppercase text-xs tracking-widest">ფილტრი:</span>
          </div>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-sm font-black uppercase tracking-tighter transition-all cursor-pointer relative ${
                filter === cat ? 'text-[#FFFF2E]' : 'text-gray-500 hover:text-white'
              }`}
            >
              {cat}
              {filter === cat && (
                <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#FFFF2E]" />
              )}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
            {filteredBooks.length} ნივთი
          </div>
        </div>

        {catalogError && (
          <div className="mb-12 border-2 border-red-600/40 bg-red-600/10 text-red-500 p-4 text-[10px] font-black uppercase tracking-widest">
            კატალოგის შეცდომა: {catalogError}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
          {isLoading ? (
            <>
              {[...Array(8)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} {...book} onClick={() => onBookClick(book)} onAddToCart={() => onAddToCart(book)} />
                ))}
              </AnimatePresence>
              {filteredBooks.length === 0 && (
                <div className="col-span-full py-32 text-center border-4 border-dashed border-white/10">
                  <h3 className="text-4xl font-black uppercase text-gray-500 italic">შესაბამისი ჩანაწერი არ მოიძებნა</h3>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-600">არქივში ამ სიგნალის ჩანაწერი არ არის</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const VoteButtons = ({ reviewId, upvotes = 0, downvotes = 0, userVote, onVote, onRemoveVote, disabled }) => {
  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (userVote === 1) {
      onRemoveVote(reviewId);
    } else {
      onVote(reviewId, 1);
    }
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (userVote === -1) {
      onRemoveVote(reviewId);
    } else {
      onVote(reviewId, -1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleUpvote}
        disabled={disabled}
        className={`flex items-center gap-1 text-xs font-bold uppercase transition-colors cursor-pointer ${
          userVote === 1 ? 'text-[#FFFF2E]' : 'text-gray-500 hover:text-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsUp className={`w-4 h-4 transition-transform hover:scale-110 cursor-pointer ${userVote === 1 ? 'fill-[#FFFF2E]' : ''}`} />
        {upvotes || 0}
      </button>

      <button
        onClick={handleDownvote}
        disabled={disabled}
        className={`flex items-center gap-1 text-xs font-bold uppercase transition-colors cursor-pointer ${
          userVote === -1 ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsDown className={`w-4 h-4 transition-transform hover:scale-110 cursor-pointer ${userVote === -1 ? 'fill-red-500' : ''}`} />
        {downvotes || 0}
      </button>

    </div>
  );
};

const ReviewsPage = ({ reviews, reviewsError, user, onReviewsChange, isLoading }) => {
  const navigate = useNavigate();
  const [votingReviewId, setVotingReviewId] = useState<string | number | null>(null);

  const handleVote = async (reviewId: string | number, voteType: 1 | -1) => {
    if (!user) return;
    setVotingReviewId(reviewId);
    try {
      await api.voteOnReview(reviewId, voteType);
      onReviewsChange?.();
    } catch (err: any) {
      console.error('Vote failed:', err);
    } finally {
      setVotingReviewId(null);
    }
  };

  const handleRemoveVote = async (reviewId: string | number) => {
    if (!user) return;
    setVotingReviewId(reviewId);
    try {
      await api.removeVote(reviewId);
      onReviewsChange?.();
    } catch (err: any) {
      console.error('Remove vote failed:', err);
    } finally {
      setVotingReviewId(null);
    }
  };

  return (
    <div className="pt-32 pb-32 px-6">
      <div className="container mx-auto">
        <header className="mb-12 md:mb-20">
          <div className="flex items-center gap-4 text-coral-400 font-black uppercase text-xs tracking-widest mb-4">
            <span className="w-12 h-[2px] bg-red-500" />
            თემის ხმები
          </div>
          <h2 className="text-6xl md:text-8xl lg:text-[12vw] font-black uppercase leading-[0.8] tracking-tighter">შეფასებები</h2>
        </header>

        {reviewsError && (
          <div className="mb-12 border-2 border-red-600/40 bg-red-600/10 text-red-500 p-4 text-[10px] font-black uppercase tracking-widest">
            შეფასებების შეცდომა: {reviewsError}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-24 border-4 border-dashed border-white/10 text-center">
            <h3 className="text-3xl font-black uppercase text-gray-600">შეფასებები არ არის ხელმისწვდომი</h3>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-600">დაუკავშირდით სერვერს შეფასებების ჩასატვირთად</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-zinc-900 border-2 border-white/5 p-8 flex flex-col gap-6 relative group hover:border-[#FFFF2E]/50 transition-colors ${
                  review.bookId ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (review.bookId) {
                    navigate(`/book/${review.bookId}`);
                  }
                }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                  {"/".repeat(review.rating)}
                </div>

                <div className="flex items-center gap-4">
                  {review.avatar ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFFF2E] grayscale group-hover:grayscale-0 transition-all">
                      <ImageWithFallback src={review.avatar} className="w-full h-full object-cover" alt={review.user} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FFFF2E] text-black flex items-center justify-center font-black text-lg border-2 border-[#FFFF2E]">
                      {review.user?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-black uppercase text-sm tracking-widest">{review.user}</h4>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{review.date}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="inline-block bg-[#FFFF2E] text-black px-2 py-1 text-[10px] font-black uppercase italic">
                    რეფ: {review.bookTitle}
                  </div>
                  <p className="text-sm font-bold uppercase leading-relaxed tracking-tight text-gray-300">
                    "{review.content}"
                  </p>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                  <StarRating rating={review?.rating} size="sm" />
                  <div className="flex items-center gap-4">
                    <VoteButtons
                      reviewId={review.id}
                      upvotes={review.upvotes}
                      downvotes={review.downvotes}
                      userVote={review.userVote}
                      onVote={handleVote}
                      onRemoveVote={handleRemoveVote}
                      disabled={!user || votingReviewId === review.id}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-black py-16 md:py-24 px-6 border-t-8 border-[#FFFF2E]">
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-2">
        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-6">INK SLAB</h2>
        <p className="text-gray-500 font-bold uppercase text-xs max-w-sm mb-8">
          გვჯერა მელნის სურნელისა და ქაღალდის შეგრძნების. ციფრული ვალია. ანალოგური თავისუფლებაა.
        </p>
        <div className="flex gap-4">
          {['IG', 'TW', 'YT', 'TK'].map(s => (
            <div key={s} className="w-10 h-10 border-2 border-white/10 flex items-center justify-center text-[10px] font-black hover:bg-white hover:text-black transition-all cursor-pointer">
              {s}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-black uppercase text-xs mb-6 text-[#FFFF2E] tracking-widest">ნავიგაცია</h4>
        <ul className="flex flex-col gap-3 text-sm font-black uppercase">
          <li><a href="#" className="hover:text-[#FFFF2E] transition-colors">მაღაზია</a></li>
          <li><a href="#" className="hover:text-[#FFFF2E] transition-colors">არქივები</a></li>
          <li><a href="#" className="hover:text-[#FFFF2E] transition-colors">წარდგენები</a></li>
          <li><a href="#" className="hover:text-[#FFFF2E] transition-colors">საბითუმო</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-black uppercase text-xs mb-6 text-[#FFFF2E] tracking-widest">კონტაქტი</h4>
        <ul className="flex flex-col gap-3 text-sm font-black uppercase">
          <li>BASEMENT 4, LONDON</li>
          <li>HELLO@INKSLAB.CC</li>
          <li>+44 020 888 999</li>
          <li>ორშ-შაბ 11:00-19:00</li>
        </ul>
      </div>
    </div>
    <div className="container mx-auto mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
      <div>© 2026 INK SLAB COLLECTIVE. ყველა უფლება დაცულია.</div>
      <div className="flex gap-8">
        <a href="#">პირადი მონაცემების დაცვა</a>
        <a href="#">გაყიდვის პირობები</a>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
  const isChromeHiddenRoute = location.pathname.startsWith('/reader/') || location.pathname.startsWith('/draft/');

  const routeMap = useMemo(() => ({
    home: '/',
    books: '/books',
    community: '/community',
    reviews: '/reviews',
    login: '/login',
    register: '/register',
    profile: '/profile',
    wallet: '/wallet',
    library: '/library',
    'upload-book': '/upload',
    'my-books': '/my-books'
  }), []);

  const handleNavigate = (target: keyof typeof routeMap) => {
    navigate(routeMap[target] ?? '/');
  };

  useEffect(() => {
    auth.getSession().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const loadReviews = async () => {
    setReviewsError(null);
    setIsReviewsLoading(true);
    try {
      const reviewData = await api.getReviews();
      setReviews(reviewData);
    } catch (err: any) {
      setReviewsError(err.message || 'REVIEWS_UNAVAILABLE');
    } finally {
      setIsReviewsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setCatalogError(null);
      setIsCatalogLoading(true);
      try {
        const [booksData, featuredData] = await Promise.all([
          api.getBooks(),
          api.getFeaturedBooks()
        ]);
        if (cancelled) return;
        setBooks(booksData);
        setFeaturedBooks(featuredData);
      } catch (err: any) {
        if (!cancelled) setCatalogError(err.message || 'CATALOG_UNAVAILABLE');
      } finally {
        if (!cancelled) setIsCatalogLoading(false);
      }
    };

    const loadInitialReviews = async () => {
      setReviewsError(null);
      setIsReviewsLoading(true);
      try {
        const reviewData = await api.getReviews();
        if (!cancelled) setReviews(reviewData);
      } catch (err: any) {
        if (!cancelled) setReviewsError(err.message || 'REVIEWS_UNAVAILABLE');
      } finally {
        if (!cancelled) setIsReviewsLoading(false);
      }
    };

    loadCatalog();
    loadInitialReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBookClick = (book: any) => {
    setSelectedBook(book);
    navigate(`/book/${book.id}`, { state: { book } });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (location.pathname !== '/books' && query.trim() !== '') {
      navigate('/books');
    }
  };

  const handleSignOut = async () => {
    await auth.logout();
    setUser(null);
    navigate('/');
  };

  const addToCart = (book: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.book.id === book.id);
      if (existing) {
        return prev;
      }
      return [...prev, { book }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (bookId: number) => {
    setCart(prev => prev.filter(item => item.book.id !== bookId));
  };

  const handleExecuteOrder = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      for (const item of cart) {
        await api.createOrder({
          bookId: item.book.id,
          bookTitle: item.book.title,
          price: item.book.price,
          img: item.book.img || item.book.cover_image_url
        });
      }
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      setCheckoutError(err?.message || 'ORDER_FAILED');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const BookDetailRoute = () => {
    const params = useParams();
    const routeLocation = useLocation();
    const locationBook = (routeLocation.state as any)?.book as Book | undefined;
    const bookId = params.bookId;

    const book = locationBook
      || (selectedBook && String(selectedBook.id) === String(bookId) ? selectedBook : null)
      || [...featuredBooks, ...books].find((item) => String(item.id) === String(bookId));

    if (!book) {
      return <Navigate to="/books" replace />;
    }

    return (
      <BookPage
        book={book}
        relatedBooks={[...featuredBooks, ...books]}
        user={user}
        onBack={() => navigate('/books')}
        onAddToCart={() => addToCart(book)}
        onReadBook={() => navigate(`/reader/${book.id}`, { state: { book } })}
        onOpenBook={(nextBook) => navigate(`/book/${nextBook.id}`, { state: { book: nextBook } })}
      />
    );
  };

  const BookDraftRoute = () => {
    const params = useParams();
    const bookId = params.bookId;

    if (!bookId) {
      return <Navigate to="/my-books" replace />;
    }

    return (
      <BookDraftView
        bookId={bookId}
        onBack={() => navigate('/my-books')}
      />
    );
  };

  if (isAuthRoute) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginView
              onBack={() => navigate('/')}
              onSwitchToRegister={() => navigate('/register')}
              onSuccess={(authedUser) => {
                setUser(authedUser);
                navigate('/');
              }}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterView
              onBack={() => navigate('/')}
              onSwitchToLogin={() => navigate('/login')}
              onSuccess={() => navigate('/login')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div
      className="min-h-screen bg-black text-white selection:bg-[#FFFF2E] selection:text-black font-sans antialiased overflow-x-hidden"
    >
      {!isChromeHiddenRoute && (
        <Navbar
          onNavigate={handleNavigate}
          user={user}
          onSignOut={handleSignOut}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          cartCount={cart.length}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        onExecuteOrder={handleExecuteOrder}
        isExecuting={isCheckingOut}
        executeError={checkoutError}
      />

      <main>
        <Routes>
          <Route path="/" element={<HomePage onNavigate={handleNavigate} onBookClick={handleBookClick} featuredBooks={featuredBooks} archiveBooks={featuredBooks} catalogError={catalogError} isLoading={isCatalogLoading} />} />
          <Route path="/books" element={<BooksPage onBookClick={handleBookClick} searchQuery={searchQuery} books={books} onAddToCart={addToCart} catalogError={catalogError} isLoading={isCatalogLoading} />} />
          <Route path="/community" element={<CommunityView />} />
          <Route path="/reviews" element={<ReviewsPage reviews={reviews} reviewsError={reviewsError} user={user} onReviewsChange={() => loadReviews()} isLoading={isReviewsLoading} />} />
          <Route path="/book/:bookId" element={<BookDetailRoute />} />
          <Route
            path="/reader/:bookId"
            element={
              <ReaderView
                user={user}
                onBack={() => navigate(-1)}
                onAddToCart={addToCart}
                onLoginRequired={() => navigate('/login')}
              />
            }
          />
          <Route path="/profile" element={<ProfilePage user={user} onBack={() => navigate('/')} onUserUpdate={setUser} />} />
          <Route path="/wallet" element={<WalletView user={user} onBack={() => navigate('/')} />} />
          <Route path="/upload" element={<UploadBookView user={user} onBack={() => navigate('/')} onLoginRequired={() => navigate('/login')} />} />
          <Route path="/library" element={<LibraryView user={user} onBack={() => navigate('/')} onBookClick={handleBookClick} />} />
          <Route path="/my-books" element={<MyBooksView user={user} onBack={() => navigate('/')} onUploadNew={() => navigate('/upload')} />} />
          <Route path="/draft/:bookId" element={<BookDraftRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isChromeHiddenRoute && <Footer />}
    </div>
  );
}
