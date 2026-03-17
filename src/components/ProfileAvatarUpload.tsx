import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Loader2, User } from 'lucide-react';

import { ImageWithFallback } from './figma/ImageWithFallback';
import type { User as AppUser } from '../types';

interface ProfileAvatarUploadProps {
  user: AppUser | null;
  onUpload: (file: File) => Promise<void>;
  avatarRefreshToken?: number;
}

export const ProfileAvatarUpload: React.FC<ProfileAvatarUploadProps> = ({
  user,
  onUpload,
  avatarRefreshToken = 0
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const withCacheBuster = (url: string | null, token: number) => {
    if (!url) return null;
    if (!token) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${token}`;
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleImageClick = () => {
    if (!uploading && user && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
    setUploading(true);
    setError(null);

    try {
      await onUpload(file);
      setPreview(null);
    } catch (err: any) {
      setError(err?.message || 'ავატარის ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const remoteAvatarUrl = user?.profileImage || user?.profile_image || null;
  const avatarUrl = preview || withCacheBuster(remoteAvatarUrl, avatarRefreshToken);

  return (
    <div className="profile-avatar-upload">
      {/* Clickable Avatar Container */}
      <div
        onClick={handleImageClick}
        className={`
          relative w-32 h-32 bg-black border-2 border-white/20 mb-4 
          flex items-center justify-center overflow-hidden
          cursor-pointer group
          ${uploading || !user ? 'cursor-not-allowed opacity-70' : ''}
        `}
        role="button"
        tabIndex={uploading || !user ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleImageClick();
          }
        }}
        aria-label="პროფილის ფოტოს შეცვლა"
      >
        {/* Avatar Image */}
        {avatarUrl ? (
          <ImageWithFallback 
            src={avatarUrl} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            alt="Profile avatar" 
          />
        ) : (
          <User className="w-16 h-16 text-gray-700 transition-colors duration-300 group-hover:text-gray-500" />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-[#FFFF2E] animate-spin" />
          ) : (
            <>
              <Camera className="w-8 h-8 text-[#FFFF2E] mb-2" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                ფოტოს შეცვლა
              </span>
            </>
          )}
        </div>

        {/* Focus Ring */}
        <div className="absolute inset-0 border-2 border-[#FFFF2E] opacity-0 focus-within:opacity-100 transition-opacity m-1" />

        {/* Uploading Indicator (shown when not hovering but uploading) */}
        {uploading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#FFFF2E] animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading || !user}
      />
    </div>
  );
};
