import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  CreditCard,
  Plus,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { User as AppUser, WalletStats, WalletTransaction } from '../types';

interface WalletViewProps {
  user: AppUser | null;
  onBack: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ user, onBack }) => {
  const TRANSACTIONS_PER_PAGE = 8;
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [amount, setAmount] = useState('');
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const totalTransactionPages = Math.max(1, Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE));
  const visibleTransactions = transactions.slice(
    (transactionsPage - 1) * TRANSACTIONS_PER_PAGE,
    transactionsPage * TRANSACTIONS_PER_PAGE,
  );

  useEffect(() => {
    if (transactionsPage > totalTransactionPages) {
      setTransactionsPage(totalTransactionPages);
    }
  }, [transactionsPage, totalTransactionPages]);

  useEffect(() => {
    let cancelled = false;
    const loadWallet = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, txData] = await Promise.all([
          api.getWalletStats(),
          api.getWalletTransactions()
        ]);
        if (cancelled) return;
        setStats(statsData);
        setTransactions(txData || []);
        setTransactionsPage(1);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'WALLET_OFFLINE');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (user) {
      loadWallet();
    } else {
      setLoading(false);
      setTransactions([]);
      setStats(null);
      setError('AUTHENTICATION_REQUIRED');
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('INVALID_AMOUNT');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const result = await api.deposit(parseFloat(amount));
      // Refresh wallet data
      const statsData = await api.getWalletStats();
      const txData = await api.getWalletTransactions();
      setStats(statsData);
      setTransactions(txData || []);
      setTransactionsPage(1);
      setAmount('');
      setActiveTab('overview');
      alert(`შეტვირთვა წარმატებულია! დაემატა ${result.amount}. ახალი ბალანსი: ${result.new_balance}`);
    } catch (err: any) {
      setError(err.message || 'DEPOSIT_FAILED');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black">
      <div className="container mx-auto px-6">
        {/* Navigation */}
        <button 
          onClick={onBack}
          className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] mb-12 hover:text-[#FFFF2E] transition-all"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
          [ საცავის დატოვება ]
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Metrics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-8 border-4 border-white bg-zinc-950 shadow-[10px_10px_0px_0px_rgba(255,255,46,1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFFF2E]/5 -rotate-45 translate-x-10 -translate-y-10 group-hover:bg-[#FFFF2E]/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-[#FFFF2E] mb-6">
                  <Wallet className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">სინდიკატის ბალანსი</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-500">ფუნტი</span>
                  <h2 className="text-6xl font-black tracking-tighter">£{stats?.balance ?? '0.00'}</h2>
                </div>
                <div className="mt-8 flex gap-2">
                  <div className="flex-1 h-2 bg-white/10 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      className="h-full bg-[#FFFF2E]" 
                    />
                  </div>
                  <span className="text-[8px] font-black uppercase text-gray-600">ლიმიტი: 5.0K</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="p-6 border-2 border-white/10 bg-white/5 hover:border-white transition-all">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white">სულ გამომუშავებული</span>
                </div>
                <div className="text-3xl font-black">£{stats?.totalMade ?? '0.00'}</div>
              </div>
              <div className="p-6 border-2 border-white/10 bg-white/5 hover:border-white transition-all">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white">სინქრონიზაციის მოლოდინში</span>
                </div>
                <div className="text-3xl font-black text-[#FFFF2E]">£{stats?.pending ?? '0.00'}</div>
              </div>
            </div>
          </div>

          {/* Main Action Area */}
          <div className="lg:col-span-8">
            <div className="bg-zinc-950 border-4 border-white h-full flex flex-col">
              {/* Header Tabs */}
              <div className="flex border-b-4 border-white bg-black">
                {[
                  { id: 'overview', label: 'მანიფესტი', icon: ShieldCheck },
                  { id: 'deposit', label: 'თანხის შეტვირთვა', icon: ArrowDownLeft },
                  { id: 'withdraw', label: 'გამოტანა', icon: ArrowUpRight },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-6 px-4 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-r-4 border-white last:border-r-0 ${
                      activeTab === tab.id ? 'bg-[#FFFF2E] text-black' : 'hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black uppercase italic tracking-widest">ტრანზაქციების ისტორია</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          სინდიკატი დაცულია
                        </div>
                      </div>

                      <div className="space-y-4">
                        {loading ? (
                          <div className="p-8 border-2 border-dashed border-white/10 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                            შენახვის სინქრონიზაცია...
                          </div>
                        ) : error ? (
                          <div className="p-8 border-2 border-red-600/20 bg-red-600/5 text-center text-[10px] font-black uppercase tracking-widest text-red-500">
                            შეცდომა შენახვაში: {error}
                          </div>
                        ) : transactions.length === 0 ? (
                          <div className="p-8 border-2 border-dashed border-white/10 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                            ტრანზაქციები არ არის დაფიქსირებული
                          </div>
                        ) : (
                          visibleTransactions.map((tx) => (
                            <div key={tx.id} className="group flex items-center justify-between p-4 border-2 border-white/5 hover:border-white transition-all bg-black/40">
                              <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 flex items-center justify-center border-2 ${
                                  tx.type === 'SALE' ? 'border-[#FFFF2E] text-[#FFFF2E]' : 
                                  tx.type === 'DEPOSIT' ? 'border-blue-500 text-blue-500' : 'border-red-500 text-red-500'
                                }`}>
                                     {tx.type === 'გაყიდვა' ? <TrendingUp className="w-5 h-5" /> : 
                                    tx.type === 'შეტვირთვა' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div>
                                  <h4 className="font-black uppercase text-sm tracking-tight">{tx.label}</h4>
                                  <div className="flex gap-4 text-[8px] font-black uppercase text-gray-600">
                                    <span>იდენტიფიკატორი: {tx.id}</span>
                                    <span>თარიღი: {tx.date}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xl font-black ${tx.amount.startsWith('+') ? 'text-white' : 'text-red-500'}`}>
                                  {tx.amount}
                                </div>
                                <span className={`text-[8px] font-black uppercase ${tx.status === 'მოლოდინში' ? 'text-[#FFFF2E]' : 'text-gray-600'}`}>
                                  [{tx.status}]
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {!loading && !error && transactions.length > TRANSACTIONS_PER_PAGE && (
                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                            გვერდი {transactionsPage} / {totalTransactionPages}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTransactionsPage((prev) => Math.max(1, prev - 1))}
                              disabled={transactionsPage === 1}
                              className="px-4 py-2 border-2 border-white/20 text-[10px] font-black uppercase tracking-widest hover:border-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              წინა
                            </button>
                            <button
                              onClick={() => setTransactionsPage((prev) => Math.min(totalTransactionPages, prev + 1))}
                              disabled={transactionsPage === totalTransactionPages}
                              className="px-4 py-2 border-2 border-white/20 text-[10px] font-black uppercase tracking-widest hover:border-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              შემდეგი
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(activeTab === 'deposit' || activeTab === 'withdraw') && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="max-w-md mx-auto py-12 space-y-12"
                    >
                      <div className="text-center space-y-4">
                        <h3 className="text-4xl font-black uppercase italic">
                          {activeTab === 'deposit' ? 'სისტემური კრედიტების შეტვირთვა' : 'სინდიკატის ღირებულების გამოტანა'}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed">
                          {activeTab === 'deposit' 
                            ? 'სინდიკატის კრედიტების შეტვირთვა დაშიფრული გზის გავლით. თანხა ხელმისაწვდომია ქსელის დადასტურებისთანავე.'
                            : 'თანხა გადაიგზავნება თქვენს რეგისტრირებულ უცხოურ ანგარიშზე. სინქრონიზაციის დრო რეგიონზეა დამოკიდებული (12სთ - 48სთ).'}
                        </p>
                      </div>

                      <div className="space-y-8">
                        <div className="relative group">
                          <label className="absolute -top-3 left-4 bg-black px-2 text-[10px] font-black text-[#FFFF2E] uppercase z-10">შეიყვანეთ თანხა (ფუნტი)</label>
                          <div className="flex items-center border-4 border-white bg-black/50 p-6 focus-within:border-[#FFFF2E] transition-all">
                            <span className="text-4xl font-black text-gray-700 mr-4">£</span>
                            <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-transparent text-4xl font-black uppercase outline-none placeholder:text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {['50', '100', '250', '500'].map(val => (
                            <button 
                              key={val}
                              onClick={() => setAmount(val)}
                              className="py-3 border-2 border-white/10 font-black text-xs hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all"
                            >
                              +£{val}
                            </button>
                          ))}
                        </div>

                        <button 
                          onClick={activeTab === 'deposit' ? handleDeposit : undefined}
                          disabled={processing || !amount}
                          className="w-full bg-white text-black py-8 text-2xl font-black uppercase tracking-tighter hover:bg-[#FFFF2E] transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing ? (
                            <span className="animate-pulse">დამუშავება...</span>
                          ) : (
                            <>
                              {activeTab === 'deposit' ? 'შეტვირთვის დაწყება' : 'გამოტანის განხორციელება'}
                              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-4 opacity-30 grayscale justify-center">
                          <CreditCard className="w-6 h-6" />
                          <ShieldCheck className="w-6 h-6" />
                          <span className="text-[10px] font-black">უსაფრთხო სინდიკატის პროტოკოლი V4</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
