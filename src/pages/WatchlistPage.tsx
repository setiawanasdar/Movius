import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlistStore } from '../stores/useWatchlistStore';
import { RatingBadge } from '../components/common/RatingBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getPosterUrl } from '../utils/formatters';
import { Bookmark, Trash2, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

type FilterTab = 'all' | 'ongoing' | 'completed';

export const WatchlistPage: React.FC = () => {
  useDocumentTitle('Daftar Tontonan (Watchlist) — Movius');
  const { watchlist, removeFromWatchlist } = useWatchlistStore();
  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredItems = watchlist.filter((item) => {
    if (filter === 'ongoing') return item.status?.toLowerCase() === 'ongoing';
    if (filter === 'completed') return item.status?.toLowerCase() === 'completed';
    return true;
  });

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-rose-500 fill-rose-500" />
            <span>Watchlist Saya</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simpan film dan serial favorit Anda untuk ditonton nanti tanpa takut lupa.
          </p>
        </div>

        {/* Filter Tabs */}
        {watchlist.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                filter === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Semua ({watchlist.length})
            </button>
            <button
              onClick={() => setFilter('ongoing')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                filter === 'ongoing'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Ongoing
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                filter === 'completed'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Tamat
            </button>
          </div>
        )}
      </div>

      {/* Grid or Empty */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-rose-500" />}
          title={
            watchlist.length === 0
              ? 'Watchlist Anda Masih Kosong'
              : 'Tidak Ada Serial yang Cocok dengan Filter'
          }
          description="Temukan tayangan seru dari ribuan serial TV dan Drama Korea pilihan, lalu klik tombol simpan untuk menambahkannya ke sini."
          actionText="Jelajahi Serial Populer"
          actionTo="/browse?category=popular"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.slug}
              className="group relative flex flex-col rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/40 transition-all duration-300"
            >
              <Link to={`/series/${item.slug}`} className="relative aspect-[2/3] w-full bg-slate-800">
                <img
                  src={getPosterUrl(item.poster)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  {item.rating && <RatingBadge rating={item.rating} size="sm" />}
                  {item.status?.toLowerCase() === 'completed' ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/90 text-white">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Tamat
                    </span>
                  ) : null}
                </div>

                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </Link>

              {/* Title & Delete button */}
              <div className="p-3 flex flex-col gap-1.5">
                <Link
                  to={`/series/${item.slug}`}
                  className="text-xs md:text-sm font-semibold text-slate-100 hover:text-rose-400 transition-colors truncate"
                >
                  {item.title}
                </Link>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                  <span>{item.year || 'Series'}</span>
                  <button
                    onClick={() => removeFromWatchlist(item.slug, item.title)}
                    aria-label="Hapus dari Watchlist"
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
