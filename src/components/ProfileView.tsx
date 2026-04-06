import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  ShieldCheck, 
  ArrowLeft, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  FileText,
  Database,
  RefreshCw,
  Settings,
  X
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { api } from '../services/api';
import type { User as AppUser, Order } from '../types';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';
import { ProfileForm } from './ProfileForm';
import '../styles/profile.css';

interface ProfileViewProps {
  onBack: () => void;
  user: AppUser | null;
  onUserUpdate?: (user: AppUser) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, user, onUserUpdate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [profileUser, setProfileUser] = useState<AppUser | null>(user);
  const [avatarRefreshToken, setAvatarRefreshToken] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err: any) {
      console.error('Profile fetch internal error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
      setOrders([]);
      setError('AUTHENTICATION_REQUIRED');
    }
  }, [user]);

  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSettingsOpen]);

  const handleManualSync = () => {
    setSyncing(true);
    fetchOrders();
  };

  const activeUser = profileUser;
  const fullName = activeUser?.name || 'ანონიმური მომხმარებელი';
  const handle = activeUser?.handle || 'სახელური';
  const bio = activeUser?.bio || null;

  const handleProfileUpdated = (updatedUser: AppUser) => {
    setProfileUser(updatedUser);
    onUserUpdate?.(updatedUser);
  };

  const handleProfileSave = async (payload: { name?: string; bio?: string }) => {
    const updatedUser = await api.updateProfile(payload);
    handleProfileUpdated(updatedUser);
  };

  const handleAvatarUpload = async (file: File) => {
    const updatedUser = await api.updateProfile({ profileImage: file });
    setAvatarRefreshToken((current) => current + 1);
    handleProfileUpdated(updatedUser);
  };

  return (
    <div className="min-h-screen bg-[#111] text-white pt-24 md:pt-32 pb-24 px-4 md:px-6 selection:bg-[#FFFF2E] selection:text-black font-mono relative overflow-hidden">
      {/* Background Grid/Industrial Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 md:mb-16">
          <button 
            onClick={onBack}
            className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-[#FFFF2E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
            [ უკან ]
          </button>
          
           <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 სინქრონიზებულია
              </div>
             <button 
              onClick={handleManualSync}
              disabled={syncing || loading}
              className="text-[10px] font-black uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 md:px-4 md:py-2 border border-white/10 flex items-center gap-2 transition-all disabled:opacity-30"
             >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                განახლება
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-[10px] font-black uppercase bg-white/5 hover:bg-[#FFFF2E] hover:text-black px-3 py-1.5 md:px-4 md:py-2 border border-white/10 flex items-center gap-2 transition-all"
                aria-label="Open profile settings"
                title="Profile settings"
              >
                <Settings className="w-3 h-3" />
                პარამეტრები
              </button>
           </div>
         </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Dossier Card */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-zinc-900 border-4 border-white p-8 shadow-[15px_15px_0px_0px_rgba(255,255,46,0.1)] relative overflow-hidden"
            >
              {/* Folder Tab Aesthetic */}
              <div className="absolute top-0 right-0 bg-[#FFFF2E] text-black px-4 py-1 text-[9px] font-black uppercase">
                პროფილი
              </div>

              <div className="mb-10 pt-4">
                <div className="mb-6">
                  <ProfileAvatarUpload
                    user={activeUser}
                    onUpload={handleAvatarUpload}
                    avatarRefreshToken={avatarRefreshToken}
                  />
                </div>
                <h2 className="text-4xl font-black uppercase leading-none tracking-tighter mb-2 break-words">
                  {fullName}
                </h2>
                <div className="inline-block bg-[#FFFF2E] text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                  @{handle}
                </div>
                {bio && (
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 leading-relaxed">
                    {bio}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/10">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">ID:</span>
                  <span className="text-white truncate max-w-[150px]">{activeUser?.id || 'UNKNOWN'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">ელ-ფოსტა:</span>
                  <span className="text-white lowercase">{activeUser?.email || 'N/A'}</span>
                </div>
              </div>


            </motion.div>
            <div className="bg-[#FFFF2E] text-black p-6 font-black uppercase italic text-xs shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-4 h-4" />
                შენიშვნა:
              </div>
              "YOUR PURCHASES ARE YOURS ALONE. WE DO NOT TRACK, WE DO NOT ADVERTISE, WE DO NOT COMPLY."
            </div>
          </div>

          {/* Right Column: Acquisition Stream */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-end justify-between border-b-2 border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 border border-white/10">
                  <Package className="w-6 h-6 text-[#FFFF2E]" />
                </div>
                <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">ჩემი შეძენები</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">შეძენილი წიგნები // სულ: {orders.length}</p>
                </div>
              </div>
              <div className="hidden md:block text-[9px] font-black text-gray-700 tracking-widest">
                QUADUNI-ის გარანტია
              </div>
            </div>

            <div className="min-h-[400px]">
              {loading && !syncing ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-30">
                  <Loader2 className="w-16 h-16 animate-spin text-[#FFFF2E]" />
                  <span className="text-xs font-black uppercase tracking-[0.5em] animate-pulse">იტვირთება...</span>
                </div>
              ) : error ? (
                <div className="border-4 border-red-600/20 bg-red-600/5 p-12 text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-600/10 mb-4">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h4 className="text-3xl font-black uppercase text-red-600 tracking-tighter">შეცდომა</h4>
                  <p className="text-xs uppercase font-bold text-gray-400 max-w-md mx-auto leading-relaxed">
                    შეძენების ჩამოტვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ მოგვიანებით.
                  </p>
                  <div className="bg-black/50 p-4 border border-red-600/30 font-mono text-red-400 text-[10px] break-all">
                    LOG_ERR: {error}
                  </div>
                  <button 
                    onClick={fetchOrders}
                    className="mt-8 bg-red-600 text-white px-10 py-4 text-xs font-black uppercase hover:bg-white hover:text-red-600 transition-colors"
                  >
                    ხელახლა ცდა
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="border-4 border-dashed border-white/10 p-24 text-center space-y-8 group">
                  <div className="relative inline-block">
                    <FileText className="w-24 h-24 text-zinc-800 group-hover:text-zinc-700 transition-colors" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase text-zinc-700">ცარიელია</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800">ჯერ არ შეგიძენია არცერთი წიგნი</p>
                  </div>
                  <button 
                    onClick={onBack}
                    className="bg-zinc-800 text-white px-10 py-5 text-xs font-black uppercase hover:bg-[#FFFF2E] hover:text-black transition-all transform hover:-translate-y-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]"
                  >
                    წიგნების დათვალიერება
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {orders.map((order, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={order.id} 
                        className="bg-zinc-950 border-2 border-white/5 p-5 flex flex-col md:flex-row gap-8 group hover:border-[#FFFF2E] transition-all relative overflow-hidden"
                      >
                        {/* Status Stripe */}
                        <div className="absolute top-0 right-0 h-full w-1 bg-zinc-800 group-hover:bg-[#FFFF2E] transition-colors" />
                        
                        <div className="w-full md:w-28 aspect-[3/4] bg-black border border-white/10 overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-xl">
                          <ImageWithFallback src={order.img} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-transform" alt={order.bookTitle} />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                      <span className="bg-[#FFFF2E] text-black px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">
                        {order.status || 'დამუშავება'}
                      </span>
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        {order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'თარიღი უცნობია'} // {order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'დრო უცნობია'}
                      </span>
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none group-hover:text-[#FFFF2E] transition-colors">
                              {order.bookTitle}
                            </h3>
                            <div className="text-[9px] font-bold text-gray-700 flex items-center gap-2 uppercase tracking-[0.2em]">
                              შეკვეთის ID: <span className="text-gray-500">{order.id}</span>
                            </div>
                          </div>

                          <div className="mt-8 md:mt-0 flex items-center justify-between border-t border-white/5 pt-4">
                            <div className="text-2xl font-black text-[#FFFF2E]">{order.price}</div>
                            <button className="group/btn flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors cursor-pointer">
                              წიგნის ნახვა <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSettingsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[290] bg-black/80"
                onClick={() => setIsSettingsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-[300] flex items-center justify-center p-4"
              >
                <div className="w-full max-w-lg border-2 border-[#FFFF2E]/30 bg-black/95 text-white shadow-[0_0_25px_rgba(255,255,46,0.15)] p-5 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#FFFF2E]">პროფილის პარამეტრები</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all"
                      aria-label="Close settings"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ProfileForm user={activeUser} onSave={handleProfileSave} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Technical Footer */}
        <div className="mt-32 pt-12 border-t-2 border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-20 grayscale hover:opacity-100 transition-all duration-700">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-12 h-12 text-[#FFFF2E]" />
            <div className="text-[9px] font-black uppercase tracking-[0.2em] leading-tight">
              შენი შეძენები დაცულია <br /> <span className="text-gray-500">დაშიფვრა: AES-256-GCM // QUADUNI </span>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-widest italic text-gray-500">
            <span className="hover:text-[#FFFF2E] cursor-help">// კონფიდენციალობა</span>
            <span className="hover:text-[#FFFF2E] cursor-help">// გამოყენების პირობები</span>
            <span className="hover:text-[#FFFF2E] cursor-help">// დახმარება</span>
          </div>
        </div>
      </div>
    </div>
  );
};
