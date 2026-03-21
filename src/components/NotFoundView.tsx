import type { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { SEOMeta } from './SEOMeta';

export const NotFoundView: FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6">
      <SEOMeta
        title="გვერდი ვერ მოიძებნა"
        description="მოთხოვნილი გვერდი Quaduni-ზე ვერ მოიძებნა. შეამოწმე ბმული ან დაბრუნდი კატალოგში."
        canonical={`https://quaduni.com${location.pathname}`}
        noindex
      />
      <div className="container mx-auto max-w-4xl border-4 border-white bg-white/[0.03] p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(255,255,46,0.4)]">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#FFFF2E]">404 / გვერდი ვერ მოიძებნა</div>
        <div className="mt-8 flex items-start gap-5">
          <SearchX className="mt-1 h-10 w-10 text-[#FFFF2E]" />
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[-0.08em]">ეს მისამართი ჩვენ არქივში არ ჩანს</h1>
            <p className="mt-4 max-w-2xl text-sm md:text-base font-bold uppercase tracking-[0.16em] text-white/60">
              URL შენარჩუნებულია, რათა არასწორი ბმულები არ გადაიქცეს მთავარ გვერდად. დაბრუნდი კატალოგში ან მთავარ გვერდზე.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/books"
                className="inline-flex items-center justify-center border-4 border-[#FFFF2E] bg-[#FFFF2E] px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-black transition-transform hover:-translate-y-1"
              >
                კატალოგში დაბრუნება
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-3 border-4 border-white px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-white transition-colors hover:border-[#FFFF2E] hover:text-[#FFFF2E]"
              >
                <ArrowLeft className="h-4 w-4" />
                მთავარ გვერდზე
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
