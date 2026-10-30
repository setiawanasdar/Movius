import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { CatalogItem } from '../../types/movie';
import { RatingBadge } from './RatingBadge';
import { GenreChip } from './GenreChip';
import { useWatchlistStore } from '../../stores/useWatchlistStore';
import { HeroBannerSkeleton } from './LoadingSkeleton';
import { getPosterUrl } from '../../utils/formatters';

interface HeroBannerProps {
  items: CatalogItem[];
  loading?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isInWatchlist, toggleWatchlist } = useWatchlistStore();

  const featuredItems = items.slice(0, 5);
  const current = featuredItems[currentIndex] || items[0];

  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredItems.length]);

  if (loading || !current) {
    return <HeroBannerSkeleton />;
  }

  const isSaved = isInWatchlist(current.slug);

  const handleWatchlist = () => {
    toggleWatchlist({
      slug: current.slug,
      title: current.title,
      poster: current.poster,
      rating: current.rating,
      year: current.year,
      genres: current.genres || [],
      status: current.isComplete ? 'Completed' : 'Ongoing',
      addedAt: Date.now(),
    });
  };

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[750px] overflow-hidden select-none bg-slate-950">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={getPosterUrl(current.poster)}
          alt={current.title}
          className="w-full h-full object-cover object-center filter blur-xl scale-110 opacity-30 transform duration-1000 ease-out"
        />
        {/* Right side crisp poster visual on larger screens */}
        <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 z-10 w-[280px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
          <img
            src={getPosterUrl(current.poster)}
            alt={current.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/90 to-transparent z-10" />

      {/* Main Content Area */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 md:px-12 flex flex-col justify-end pb-12 md:pb-16">
        <div className="max-w-2xl flex flex-col gap-3.5 animate-in fade-in duration-500">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white font-bold tracking-wide uppercase text-[10px]">
              {current.isComplete ? 'TAMAT' : 'ONGOING'}
            </span>
            {current.rating && <RatingBadge rating={current.rating} size="md" />}
            {current.year && (
              <span className="text-slate-300 font-medium px-2 py-0.5 rounded bg-white/10 backdrop-blur-md">
                {current.year}
              </span>
            )}
            {current.episode && (
              <span className="text-rose-400 font-semibold">
                Episode {current.episode}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {current.title}
          </h1>

          {/* Genres */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {current.genres.slice(0, 4).map((g) => (
                <GenreChip key={g} genre={g} size="sm" />
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base text-slate-300/90 line-clamp-3 leading-relaxed max-w-xl">
            Tonton episode terbaru dari {current.title} dengan subtitle Bahasa Indonesia berkualitas tinggi, multi-server streaming tercepat, dan tanpa gangguan.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={`/series/${current.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm md:text-base transition-all duration-200 shadow-xl shadow-rose-950/40 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Nonton Sekarang</span>
            </Link>

            <button
              onClick={handleWatchlist}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 font-semibold text-sm md:text-base border border-slate-700/80 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>Tersimpan</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-5 h-5" />
                  <span>Tambah Watchlist</span>
                </>
              )}
            </button>

            <Link
              to={`/series/${current.slug}`}
              aria-label="Detail serial"
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
            >
              <Info className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Carousel controls & Dots */}
        {featuredItems.length > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
            <div className="flex items-center gap-2">
              {featuredItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ke ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-8 bg-rose-600'
                      : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length)
                }
                aria-label="Slide sebelumnya"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev + 1) % featuredItems.length)
                }
                aria-label="Slide berikutnya"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
