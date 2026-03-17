import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Zap, Skull, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { auth } from '../services/auth';

interface RegisterViewProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onBack, onSwitchToLogin, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (formData: any) => {
    setLoading(true);
    setServerError(null);
    
    try {
      await auth.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        handle: formData.handle
      });

      alert('რეგისტრაცია წარმატებულია. გაიარეთ ავტორიზაცია.');
      onSwitchToLogin();
    } catch (err: any) {
      console.error('Registration error:', err);
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFF2E] text-black flex flex-col items-center justify-center p-6 selection:bg-black selection:text-[#FFFF2E] font-sans relative overflow-hidden">
      {/* Background Graphic Elements */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none grayscale contrast-200 brightness-50">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1582035100994-9ddfc34b1dae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" 
          className="w-full h-full object-cover" 
          alt="texture" 
        />
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-black text-white p-8 md:p-16 relative z-10 shadow-[40px_40px_0px_0px_rgba(0,0,0,0.2)] border-8 border-black"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b-4 border-white/20 pb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-[#FFFF2E] text-black px-2 py-1 text-[14px] font-black uppercase">ფორმა_რეგისტრაცია_SF2026</span>
              <span className="text-[14px] font-black uppercase text-gray-500">უსაფრთხო_არხი_v4</span>
            </div>
            <h1 className="text-6xl md:text-9xl font-black uppercase leading-[0.75] tracking-tighter">
              შემოუერთდი <br /> <span className="text-[#FFFF2E]">სინდიკატს.</span>
            </h1>
          </div>
          <button 
            onClick={onBack}
            className="text-[14px] font-black uppercase bg-[#FFFF2E] text-black px-6 py-3 hover:bg-white transition-colors"
          >
            [ განაცხადის გაუქმება ]
          </button>
        </div>

        {serverError && (
          <div className="mb-8 p-4 bg-red-600 text-white font-black uppercase text-[14px] italic animate-pulse">
            შეცდომა: {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[#FFFF2E]" /> სახელი
                </label>
                <input 
                  {...register("firstName", { required: true })}
                  disabled={loading}
                  className="w-full bg-zinc-900 border-2 border-white/10 p-5 text-xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all placeholder:text-zinc-700 disabled:opacity-50"
                  placeholder="სახელი"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[#FFFF2E]" /> გვარი
                </label>
                <input 
                  {...register("lastName", { required: true })}
                  disabled={loading}
                  className="w-full bg-zinc-900 border-2 border-white/10 p-5 text-xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all placeholder:text-zinc-700 disabled:opacity-50"
                  placeholder="გვარი"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#FFFF2E]" /> კოდური სახელი
              </label>
              <input 
                {...register("handle", { required: true })}
                disabled={loading}
                className="w-full bg-zinc-900 border-2 border-white/10 p-5 text-xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all placeholder:text-zinc-700 disabled:opacity-50"
                placeholder="აირჩიეთ თქვენი ID"
              />
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#FFFF2E]" /> კომუნიკაციის არხი
              </label>
              <input 
                {...register("email", { required: true })}
                type="email"
                disabled={loading}
                className="w-full bg-zinc-900 border-2 border-white/10 p-5 text-xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all placeholder:text-zinc-700 disabled:opacity-50"
                placeholder="თქვენი@ელფოსტა.კომ"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#FFFF2E]" /> დაშიფვრის გასაღები
              </label>
              <input 
                {...register("password", { required: true, minLength: 6 })}
                type="password"
                disabled={loading}
                className="w-full bg-zinc-900 border-2 border-white/10 p-5 text-xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all placeholder:text-zinc-700 disabled:opacity-50"
                placeholder="********"
              />
              {errors.password && <div className="text-[14px] font-black text-red-500 uppercase">!! მინიმუმ 6 სიმბოლო !!</div>}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="space-y-4 mb-10">
              <label className="text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#FFFF2E]" /> გასაღების დადასტურება
              </label>
              <input 
                {...register("confirmPassword", { required: true })}
                type="password"
                disabled={loading}
                className="w-full bg-zinc-900 border-2 border-white/10 p-5 text-xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all placeholder:text-zinc-700 disabled:opacity-50"
                placeholder="********"
              />
            </div>
            
            <button 
              disabled={loading}
              className="w-full bg-[#FFFF2E] text-black py-8 text-3xl font-black uppercase italic tracking-tighter hover:bg-white transition-all transform hover:-translate-y-2 flex items-center justify-center gap-6 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <>სინქრონიზაცია მიმდინარეობს <Loader2 className="w-8 h-8 animate-spin" /></>
              ) : (
                <>სინქრონიზაციის დაწყება <Zap className="w-8 h-8 fill-current" /></>
              )}
            </button>
            <div className="mt-8 flex items-center justify-between text-[14px] font-black uppercase text-gray-600">
              <div className="flex items-center gap-2 italic">
                <ShieldCheck className="w-4 h-4" /> მესამე მხარის თვალთვალი დადასტურებულია
              </div>
              <button 
                type="button"
                onClick={onSwitchToLogin}
                className="hover:text-white transition-colors underline underline-offset-4"
              >
                უკვე წევრი ხარ? შესვლა აქ
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};