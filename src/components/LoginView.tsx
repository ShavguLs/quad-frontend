import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { GoogleLogin } from '@react-oauth/google';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight, X, ShieldAlert, Loader2 } from 'lucide-react';
import { auth } from '../services/auth';
import type { User } from '../types';

interface LoginViewProps {
  onBack: () => void;
  onSwitchToRegister: () => void;
  onSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBack, onSwitchToRegister, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setServerError(null);
    
    try {
      const user = await auth.login({
        email: data.email,
        password: data.password,
      });

      onSuccess(user);
    } catch (err: any) {
      console.error('Login error:', err);
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setServerError(null);
    try {
      const user = await auth.googleLogin(credentialResponse.credential);
      onSuccess(user);
    } catch (err: any) {
      console.error('Google login error:', err);
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row overflow-hidden selection:bg-[#FFFF2E] selection:text-black font-sans relative">
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen pointer-events-none">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1767477665624-f5ab7298a9cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" 
          className="w-full h-full object-cover grayscale brightness-50 contrast-150" 
          alt="texture" 
        />
      </div>

      <div className="relative w-full md:w-1/2 flex flex-col justify-between p-8 border-r-4 border-[#FFFF2E] z-10 bg-black/40 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="md:hidden absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center border-2 border-[#FFFF2E] text-[#FFFF2E] hover:bg-[#FFFF2E] hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-4">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="inline-block bg-[#FFFF2E] text-black px-4 py-2 text-[14px] font-black uppercase italic -rotate-2"
          >
            quaduni.com
          </motion.div>
          <h1 className="text-[12vw] md:text-[8vw] font-black uppercase leading-[1] tracking-tighter text-[#FFFF2E] mix-blend-difference">
            შესვლა
          </h1>
          <p className="text-2xl md:text-3xl font-black uppercase leading-tight text-white/90 max-w-xl">
            თქვენი წიგნების სამყარო ერთ ადგილზე — გაიარეთ ავტორიზაცია და განაგრძეთ კითხვა.
          </p>
        </div>

        <div className="space-y-8">
          <button
            onClick={onBack}
            className="hidden md:flex group items-center gap-4 text-[14px] font-black uppercase tracking-[0.3em] hover:text-[#FFFF2E] transition-colors"
          >
            <X className="w-14 h-14" /> [ მთავარ გვერდზე დაბრუნება ]
          </button>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-24 z-10">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-lg relative"
        >
          {serverError && (
            <div className="mb-8 p-4 bg-red-600 text-white font-black uppercase text-[14px] italic animate-pulse">
              ავტორიზაციის შეცდომა: {serverError}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            <div className="relative group">
              <label className="text-[14px] font-black uppercase tracking-[0.5em] text-[#FFFF2E] mb-4 block">
                ელ-ფოსტა
              </label>
              <input
                {...register("email", { required: true })}
                disabled={loading}
                type="email"
                className="w-full bg-transparent border-b-4 border-white/20 pb-4 text-4xl md:text-5xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all disabled:opacity-50"
                placeholder="name@gmail.com"
              />
            </div>

            <div className="relative group">
              <label className="text-[14px] font-black uppercase tracking-[0.5em] text-[#FFFF2E] mb-4 block">
                პაროლი
              </label>
              <input 
                {...register("password", { required: true })}
                disabled={loading}
                type="password"
                className="w-full bg-transparent border-b-4 border-white/20 pb-4 text-4xl md:text-5xl font-black uppercase outline-none focus:border-[#FFFF2E] transition-all disabled:opacity-50"
                placeholder="********"
              />
            </div>

            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                id="remember_me" 
                className="w-6 h-6 border-2 border-white bg-transparent checked:bg-[#FFFF2E] appearance-none cursor-pointer transition-colors" 
              />
              <label htmlFor="remember_me" className="text-[14px] font-black uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors">
                დამახსოვრება
              </label>
            </div>

            <div className="pt-8">
              <button 
                disabled={loading}
                className="group relative w-full bg-[#FFFF2E] text-black py-8 text-2xl font-black uppercase tracking-tighter overflow-hidden disabled:opacity-50"
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {loading ? (
                    <>შესვლა... <Loader2 className="w-8 h-8 animate-spin" /></>
                  ) : (
                    <>შესვლა <ArrowRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" /></>
                  )}
                </div>
                {!loading && <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-gray-600">ან</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setServerError('Google authentication cancelled or failed.')}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
                locale="ka"
              />
            </div>
          </div>

          <div className="mt-16 pt-16 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="hidden md:flex items-center gap-4 opacity-50">
              <ShieldAlert className="w-8 h-8 text-[#FFFF2E]" />
              <div className="text-[14px] font-black uppercase tracking-widest leading-none">
                quaduni.com <br /> <span className="text-white">დაცული კავშირი</span>
              </div>
            </div>
            <button
              onClick={onSwitchToRegister}
              className="text-[14px] font-black uppercase border-b-2 border-white/10 pb-1 hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-all"
            >
              ახალი წევრის რეგისტრაცია
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};