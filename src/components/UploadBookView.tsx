import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Image as ImageIcon, Loader2, Upload, Hash, Type, User, BookText } from 'lucide-react';
import { api } from '../services/api';
import type { User as UserType } from '../types';

interface UploadBookViewProps {
  onBack: () => void;
  onLoginRequired: () => void;
  user: UserType | null;
}

export const UploadBookView: React.FC<UploadBookViewProps> = ({ onBack, onLoginRequired, user }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: '',
    category: 'წიგნები',
    renderPreference: 'text' as 'text' | 'exact_visual',
  });

  const [files, setFiles] = useState<{ cover: File | null; pdf: File | null }>({
    cover: null,
    pdf: null,
  });

  useEffect(() => {
    if (!files.cover) {
      setCoverPreviewUrl('');
      return;
    }

    const nextUrl = URL.createObjectURL(files.cover);
    setCoverPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [files.cover]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full p-8 border-2 border-red-500 bg-zinc-950 text-center space-y-6 shadow-[10px_10px_0_0_rgba(255,0,0,0.2)]">
          <h2 className="text-3xl font-black uppercase tracking-tight">წვდომა შეზღუდულია</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 leading-relaxed">წიგნის ასატვირთად გაიარეთ ავტორიზაცია.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onBack} className="py-3 border border-white/20 text-xs font-bold uppercase hover:border-white">უკან</button>
            <button onClick={onLoginRequired} className="py-3 bg-[#FFFF2E] text-black text-xs font-black uppercase hover:bg-white">შესვლა</button>
          </div>
        </div>
      </div>
    );
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'pdf') => {
    const selected = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [type]: selected }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.pdf) {
      setError('PDF ფაილი სავალდებულოა.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.uploadBook(formData, {
        cover: files.cover,
        pdf: files.pdf,
      });
      navigate('/my-books', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ატვირთვა ვერ მოხერხდა');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClassName =
    'w-full bg-black border-2 border-white/30 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-[#FFFF2E]';

  return (
    <div className="min-h-screen bg-black text-white pt-24 md:pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] mb-10 text-gray-400 hover:text-[#FFFF2E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          [ უკან ]
        </button>

        <div className="border-l-8 border-[#FFFF2E] pl-6 mb-12">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.8]">
            წიგნის
            <br />
            <span className="text-[#FFFF2E]">ატვირთვა</span>
          </h1>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
            გამომცემლობა // მეტამონაცემები + ფაილები
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 border-2 border-white/10 bg-zinc-950 p-6 md:p-8 space-y-6">
            <div className="flex flex-row items-end gap-6">
              <label className="block flex-1">
                <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  <Type className="w-3.5 h-3.5" />
                  სათაური
                </span>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="წიგნის სათაური"
                  className={fieldClassName}
                />
              </label>

              <label className="block flex-1">
                <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  <User className="w-3.5 h-3.5" />
                  ავტორი
                </span>
                <input
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="ავტორის სახელი"
                  className={fieldClassName}
                />
              </label>
            </div>

            <div className="flex flex-row items-end gap-6">
              <label className="block w-[180px] flex-none">
                <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  <Hash className="w-3.5 h-3.5" />
                  ფასი
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className={fieldClassName}
                />
              </label>

              <label className="block flex-1">
                <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  კატეგორია
                </span>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={fieldClassName}
                >
                  <option value="ზინები">ზინები</option>
                  <option value="წიგნები">წიგნები</option>
                  <option value="ესსეები">ესსეები</option>
                  <option value="ხელოვნება">ხელოვნება</option>
                  <option value="არქივი">არქივი</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  <BookText className="w-3.5 h-3.5" />
                  აღწერა
                </span>
                <textarea
                  required
                  rows={8}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="მოკლე შინაარსი მკითხველებისთვის"
                className={`${fieldClassName} resize-none`}
              />
            </label>

            <label className="block">
              <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  <FileText className="w-3.5 h-3.5" />
                  PDF ფაილი
                </span>
              <input
                required
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => onFile(e, 'pdf')}
                className={`${fieldClassName} text-xs w-full md:max-w-[280px]`}
              />
            </label>

            <label className="block">
              <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                რენდერის რეჟიმი
              </span>
              <select
                value={formData.renderPreference}
                onChange={(e) => setFormData({ ...formData, renderPreference: e.target.value as 'text' | 'exact_visual' })}
                className={`${fieldClassName} md:max-w-[360px]`}
              >
                <option value="text">ტექსტური რეჟიმი</option>
                <option value="exact_visual">ზუსტი ვიზუალური რეჟიმი</option>
              </select>
              <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-gray-400 leading-relaxed">
                ტექსტური რეჟიმი — მონიშვნადი/საძებნი ტექსტი; ვიზუალურად შეიძლება მცირედ განსხვავდებოდეს.
                <br />
                ზუსტი ვიზუალური რეჟიმი — PDF-ის იდენტური გვერდები, სურათზე დაფუძნებული რენდერით.
              </p>
            </label>
          </section>

          <aside className="lg:col-span-4 border-2 border-white/10 bg-zinc-950 p-6 md:p-8 flex flex-col gap-6">
            <label className="block">
              <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFFF2E]">
                  <ImageIcon className="w-3.5 h-3.5" />
                  გარეკანი
                </span>
                <div className="border-2 border-dashed border-white/20 overflow-hidden bg-black">
                  {coverPreviewUrl ? (
                    <img src={coverPreviewUrl} alt="გარეკანის გადახედვა" className="aspect-[3/4] w-full object-cover" />
                  ) : (
                    <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 text-gray-500">
                      <Upload className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">გარეკანი არ არის არჩეული</span>
                    </div>
                  )}
              </div>
              <input type="file" accept="image/*" onChange={(e) => onFile(e, 'cover')} className={`${fieldClassName} mt-3 text-xs`} />
            </label>

            {error && (
              <div className="border-2 border-red-600/30 bg-red-600/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 bg-[#FFFF2E] px-5 py-4 text-black text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-60 hover:bg-white transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {submitting ? 'იტვირთება...' : 'გამოქვეყნება'}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
};
