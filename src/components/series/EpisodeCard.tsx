import React from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle } from 'lucide-react';
import type { EpisodeItem } from '../../types/movie';
import { cn } from '../../utils/cn';

interface EpisodeCardProps {
  episode: EpisodeItem;
  seriesSlug: string;
  isActive?: boolean;
  isWatched?: boolean;
  className?: string;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  seriesSlug,
  isActive = false,
  isWatched = false,
  className,
}) => {
  const watchUrl = `/watch/${episode.slug}?series=${seriesSlug}`;

  return (
    <Link
      to={watchUrl}
      className={cn(
        'group flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-200 select-none cursor-pointer',
        isActive
          ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/20'
          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700',
        className
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Episode Number Badge */}
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors shadow-inner',
            isActive
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-slate-300 group-hover:bg-rose-600 group-hover:text-white'
          )}
        >
          {episode.episodeNumber || <Play className="w-4 h-4 fill-current ml-0.5" />}
        </div>

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              'text-xs md:text-sm font-semibold truncate transition-colors',
              isActive
                ? 'text-rose-400'
                : 'text-slate-200 group-hover:text-white'
            )}
          >
            {episode.title}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>Subtitle Indonesia</span>
            {isWatched && (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                <CheckCircle className="w-3 h-3" /> Sudah Ditonton
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Play Action */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
          isActive
            ? 'bg-rose-600 text-white'
            : 'bg-slate-800 text-slate-400 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-105'
        )}
      >
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </div>
    </Link>
  );
};
