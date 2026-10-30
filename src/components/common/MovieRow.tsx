import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CatalogItem } from '../../types/movie';
import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './LoadingSkeleton';
import { cn } from '../../utils/cn';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  items: CatalogItem[];
  loading?: boolean;
  viewAllLink?: string;
  className?: string;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  subtitle,
  items,
  loading = false,
  viewAllLink,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={cn('relative flex flex-col gap-3 py-4 md:py-6 group/row', className)}>
      {/* Header */}
      <div className="flex items-end justify-between px-4 md:px-8">
        <div>
          <h3 className="text-lg md:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 bg-rose-600 rounded-full inline-block" />
            {title}
          </h3>
          {subtitle && <p className="text-xs md:text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs md:text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 group/link"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Row Container with Scroll Buttons */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Geser ke kiri"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-rose-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 shadow-xl hidden md:flex cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 md:px-8 py-2"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[140px] sm:w-[170px] md:w-[190px] shrink-0">
                  <MovieCardSkeleton />
                </div>
              ))
            : items.map((item, idx) => (
                <div
                  key={`${item.slug}-${idx}`}
                  className="w-[140px] sm:w-[170px] md:w-[190px] shrink-0"
                >
                  <MovieCard movie={item} priority={idx < 4} />
                </div>
              ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Geser ke kanan"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-rose-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 shadow-xl hidden md:flex cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};
