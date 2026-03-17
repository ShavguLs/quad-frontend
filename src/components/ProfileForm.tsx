import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';

import type { User } from '../types';

interface ProfileFormProps {
  user: User | null;
  onSave: (payload: { name?: string; bio?: string }) => Promise<void>;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave }) => {
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? '');
    setBio(user?.bio ?? '');
  }, [user?.name, user?.bio]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError('საჭიროა ავტორიზაცია');
      setStatus('error');
      return;
    }

    setSaving(true);
    setStatus('idle');
    setError(null);

    const trimmedName = name.trim();
    const currentName = user?.name ?? '';
    const currentBio = user?.bio ?? '';
    const payload: { name?: string; bio?: string } = {};

    if (trimmedName !== currentName) payload.name = trimmedName;
    if (bio !== currentBio) payload.bio = bio;

    if (!payload.name && !payload.bio) {
      setStatus('success');
      setSaving(false);
      return;
    }

    try {
      await onSave(payload);
      setStatus('success');
    } catch (err: any) {
      setError(err?.message || 'პროფილის განახლება ვერ მოხერხდა');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-panel border border-white/10 bg-black/50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-widest text-white">პარამეტრები</div>
        </div>
        <button
          type="submit"
          disabled={saving || !user}
          className="profile-action-button flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          შენახვა
        </button>
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">საჩვენებელი სახელი</label>
        <input
          className="profile-field-input text-sm font-bold uppercase tracking-wide"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="ანონიმური ერთეული"
          disabled={!user}
        />
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">ბიოგრაფია</label>
        <textarea
          className="profile-field-input profile-field-textarea text-xs font-bold uppercase tracking-wide"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="გადააგზავნეთ ბიოგრაფიის მონაცემები"
          rows={4}
          disabled={!user}
        />
      </div>

      {status === 'success' && (
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">
          სიგნალი სინქრონიზებულია
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </form>
  );
};

export default ProfileForm;
