import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, X, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { formatDuration, formatRelativeTime, getPosterUrl } from '../../utils/formatters';

export const ContinueWatchingRow: React.FC = () => {
  const { history, removeFromHistory } = useHistoryStore();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!history || history.length === 0) {
    return null;
  }

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
    <section className="relative flex flex-col gap-3 py-4 md:py-6 group/continue">
      <div className="flex items-center justify-between px-4 md:px-8">
        <div>
          <h3 className="text-lg md:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
            Lanjutkan Menonton
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Lanjutkan tontonan terakhir Anda dari bagian yang belum selesai
          </p>
        </div>

        <Link
          to="/history"
          className="text-xs md:text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <History className="w-4 h-4" />
          <span>Semua Riwayat</span>
        </Link>
      </div>

      <div className="relative">
        <button
          onClick={() => handleScroll('left')}
          aria-label="Geser ke kiri"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-rose-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/continue:opacity-100 transition-all duration-200 shadow-xl hidden md:flex cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 md:px-8 py-2"
        >
          {history.map((item) => (
            <div
              key={item.id}
              className="relative w-[240px] sm:w-[280px] shrink-0 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 transition-all duration-300 group shadow-lg"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() =>
                  navigate(
                    `/watch/${item.episodeSlug}?series=${item.seriesSlug}&resumeTime=${Math.floor(
                      item.currentTime
                    )}`
                  )
                }
                className="relative aspect-video w-full bg-slate-800 cursor-pointer overflow-hidden"
              >
                <img
                  src={getPosterUrl(item.poster)}
                  alt={item.seriesTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Center play icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform pl-0.5">
                    <Play className="w-5 h-5 fill-white" />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item.seriesSlug, item.seriesTitle);
                  }}
                  aria-label="Hapus dari daftar lanjut menonton"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Progress bar at bottom of thumbnail */}
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
                  <div
                    className="h-full bg-rose-600 rounded-r-full transition-all duration-300"
                    style={{ width: `${Math.max(5, item.percentage || 0)}%` }}
                  />
                </div>
              </div>

              {/* Info text */}
              <div className="p-3 flex flex-col gap-1">
                <h4
                  title={item.seriesTitle}
                  className="text-xs md:text-sm font-bold text-slate-100 truncate group-hover:text-rose-400 transition-colors"
                >
                  {item.seriesTitle}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">
                    S{item.season} : Ep {item.episodeNumber}
                  </span>
                  <span>{formatDuration(item.currentTime)} tersisa</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-0.5">
                  {formatRelativeTime(item.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => handleScroll('right')}
          aria-label="Geser ke kanan"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-rose-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover/continue:opacity-100 transition-all duration-200 shadow-xl hidden md:flex cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};
