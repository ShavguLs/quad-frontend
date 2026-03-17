import React from 'react';
import { motion } from 'motion/react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeConfig = {
  sm: {
    spinner: 24,
    strokeWidth: 2,
    textSize: 'text-[8px]',
    gap: 2,
  },
  md: {
    spinner: 48,
    strokeWidth: 3,
    textSize: 'text-[10px]',
    gap: 3,
  },
  lg: {
    spinner: 64,
    strokeWidth: 4,
    textSize: 'text-xs',
    gap: 4,
  },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const config = sizeConfig[size];
  const spinnerSize = config.spinner;
  const center = spinnerSize / 2;
  const radius = (spinnerSize - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: spinnerSize, height: spinnerSize }}>
        {/* Background track */}
        <svg
          width={spinnerSize}
          height={spinnerSize}
          className="absolute inset-0"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 46, 0.2)"
            strokeWidth={config.strokeWidth}
          />
        </svg>

        {/* Animated spinner */}
        <motion.svg
          width={spinnerSize}
          height={spinnerSize}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#FFFF2E"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </motion.svg>

        {/* Center dot */}
        <motion.div
          className="absolute rounded-full bg-[#FFFF2E]"
          style={{
            width: config.strokeWidth * 2,
            height: config.strokeWidth * 2,
            left: center - config.strokeWidth,
            top: center - config.strokeWidth,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />
      </div>

      {/* Optional text */}
      {text && (
        <div
          className={`${config.textSize} font-black uppercase tracking-widest text-gray-500 mt-${config.gap}`}
          style={{ marginTop: config.gap * 4 }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = 'არქივი იტვირთება...',
  fullScreen = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-8 p-12">
      <div className="relative">
        {/* Outer brutalist frame */}
        <div className="absolute -inset-4 border-4 border-[#FFFF2E]" />
        <div className="absolute -inset-8 border-2 border-white/20" />
        
        {/* Scanning line effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFFF2E]/20 to-transparent h-8"
          animate={{
            y: [-20, 80, -20],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        <LoadingSpinner size="lg" text="" />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-2xl font-black uppercase tracking-tighter text-white">
          {message}
        </p>
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <span className="w-2 h-2 bg-[#FFFF2E] rounded-full animate-pulse" />
          სადგური აქტიურია
          <span className="w-2 h-2 bg-[#FFFF2E] rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Progress bars */}
      <div className="w-64 space-y-2">
        <div className="h-1 bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-[#FFFF2E]"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
        <div className="h-1 bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-white"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="group w-full">
      <div className="relative aspect-[3/4] mb-6 overflow-hidden border-2 border-white/5 bg-zinc-900">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-1/3 bg-white/10" />
        <div className="h-6 w-3/4 bg-white/10" />
        <div className="h-2 w-1/2 bg-white/5 mt-4" />
      </div>
    </div>
  );
};

export const ReviewCardSkeleton: React.FC = () => {
  return (
    <div className="bg-zinc-900 border-2 border-white/5 p-8 flex flex-col gap-6 relative">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-white/10" />
          <div className="h-2 w-16 bg-white/5" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 bg-[#FFFF2E]/20" />
        <div className="h-4 w-full bg-white/5" />
        <div className="h-4 w-2/3 bg-white/5" />
      </div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export const FeaturedBookSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div className="col-span-12 lg:col-span-6 flex justify-center lg:justify-start">
        <div className="relative w-full max-w-[400px] aspect-[3/4] bg-zinc-900 border-4 border-white/10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>
      <div className="col-span-12 lg:col-span-6 space-y-8">
        <div className="space-y-4">
          <div className="h-3 w-32 bg-[#FFFF2E]/30" />
          <div className="h-16 w-3/4 bg-white/10" />
          <div className="h-6 w-1/2 bg-white/5" />
        </div>
        <div className="h-14 w-48 bg-white/10" />
      </div>
    </div>
  );
};

export const ArchiveBookSkeleton: React.FC = () => {
  return (
    <div className="px-6 py-12">
      <div className="relative bg-zinc-900 border-4 border-white/10">
        {/* Header Strip */}
        <div className="h-8 bg-white/10 flex items-center justify-between px-4">
          <div className="h-2 w-20 bg-white/10" />
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white/10 rounded-full" />
            <div className="w-2 h-2 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Main Content */}
        <div className="relative aspect-[3/4] overflow-hidden p-4">
          <div className="absolute inset-4 border-2 border-white/5" />
          <div className="w-full h-full bg-zinc-800" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFFF2E]/5 to-transparent h-20"
            animate={{
              y: [-80, 400, -80],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Info Block */}
        <div className="p-6 space-y-2">
          <div className="flex justify-between items-start">
            <div className="h-8 w-2/3 bg-white/10" />
            <div className="h-6 w-16 bg-white/10" />
          </div>
          <div className="h-2 w-1/2 bg-white/5" />
          <div className="pt-4 flex items-center justify-between border-t border-white/10">
            <div className="h-2 w-20 bg-white/5" />
            <div className="w-5 h-5 bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
