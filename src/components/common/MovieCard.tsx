import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import type { CatalogItem } from '../../types/movie';
import { RatingBadge } from './RatingBadge';
import { useWatchlistStore } from '../../stores/useWatchlistStore';
import { getPosterUrl, DEFAULT_POSTER_FALLBACK } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface MovieCardProps {
  movie: CatalogItem;
  className?: string;
  priority?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  className,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlistStore();

  const isSaved = isInWatchlist(movie.slug);
  const posterSrc = imageError ? DEFAULT_POSTER_FALLBACK : getPosterUrl(movie.poster);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist({
      slug: movie.slug,
      title: movie.title,
      poster: movie.poster,
      rating: movie.rating,
      year: movie.year,
      genres: movie.genres || [],
      status: movie.isComplete ? 'Completed' : 'Ongoing',
      addedAt: Date.now(),
    });
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden bg-slate-900/40 border border-slate-800/60 hover:border-rose-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-950/20 select-none',
        className
      )}
    >
      <Link to={`/series/${movie.slug}`} className="flex flex-col h-full">
        {/* Poster Container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800/60">
          {/* Shimmer Placeholder before load */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse" />
          )}

          <img
            src={posterSrc}
            alt={movie.title}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              'h-full w-full object-cover transition-all duration-500 group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Dark Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" />

          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
            {movie.rating ? (
              <RatingBadge rating={movie.rating} size="sm" />
            ) : <span />}

            {movie.isComplete ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Tamat
              </span>
            ) : movie.episode ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-600/90 text-white backdrop-blur-md shadow-sm">
                EPS {movie.episode}
              </span>
            ) : null}
          </div>

          {/* Floating Watchlist Button on Poster */}
          <button
            onClick={handleWatchlistClick}
            aria-label={isSaved ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
            className={cn(
              'absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-lg cursor-pointer',
              isSaved
                ? 'bg-rose-600 text-white opacity-100'
                : 'bg-black/60 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white hover:scale-110'
            )}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 fill-white" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Centered Play Button on Hover */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-300 z-10">
            <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-950/50 pl-0.5">
              <Play className="w-5 h-5 fill-white" />
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="flex flex-col flex-1 p-2.5 md:p-3 gap-1">
          <h4
            title={movie.title}
            className="text-xs md:text-sm font-semibold text-slate-100 line-clamp-1 group-hover:text-rose-400 transition-colors"
          >
            {movie.title}
          </h4>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-auto">
            <span>{movie.year || 'Series'}</span>
            {movie.genres && movie.genres.length > 0 && (
              <span className="truncate max-w-[100px] text-[10px] text-slate-500">
                {movie.genres[0]}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
