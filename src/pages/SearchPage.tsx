import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import type { CatalogItem } from '../types/movie';
import { MovieCard } from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SearchBar } from '../components/common/SearchBar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { storageService } from '../services/storageService';
import { Search, Clock, Trash2 } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordParam = searchParams.get('keyword') || '';

  useDocumentTitle(
    keywordParam ? `Pencarian: "${keywordParam}" — Movius` : 'Cari Film & Series — Movius'
  );

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(storageService.getSearchHistory());
  }, []);

  useEffect(() => {
    const trimmed = keywordParam.trim();
    if (!trimmed) {
      setItems([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    movieApi
      .search(trimmed, 1, controller.signal)
      .then((res) => {
        setItems(res.items || []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Gagal mencari konten.');
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [keywordParam]);

  const handleSelectRecent = (term: string) => {
    setSearchParams({ keyword: term });
  };

  const handleClearHistory = () => {
    storageService.clearSearchHistory();
    setRecentSearches([]);
  };

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Search className="w-7 h-7 text-rose-500" />
          <span>Pencarian Cepat</span>
        </h1>
        <p className="text-sm text-slate-400">
          Ketik judul film, drama korea, atau kata kunci serial apa pun untuk menemukan tayangan instan.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="max-w-2xl">
        <SearchBar
          initialValue={keywordParam}
          autoFocus={!keywordParam}
          onSearchSubmit={(val) => {
            setSearchParams({ keyword: val });
            setRecentSearches(storageService.getSearchHistory());
          }}
        />
      </div>

      {/* Recent Searches Tags */}
      {recentSearches.length > 0 && !keywordParam && (
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Pencarian Terakhir
            </span>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Bersihkan
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleSelectRecent(term)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      {keywordParam && (
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
          <span>
            Hasil pencarian untuk: <strong className="text-white">"{keywordParam}"</strong>
          </span>
          {!loading && (
            <span>
              Ditemukan <strong className="text-rose-400">{items.length}</strong> judul
            </span>
          )}
        </div>
      )}

      {/* Results Grid / Loading / Empty */}
      {error ? (
        <ErrorState
          onRetry={() => {
            if (keywordParam) setSearchParams({ keyword: keywordParam });
          }}
          message={error}
        />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : keywordParam && items.length === 0 ? (
        <EmptyState
          title={`Tidak Ada Hasil untuk "${keywordParam}"`}
          description="Pastikan ejaan kata kunci benar atau coba cari dengan judul lain (misal: doctor, love, avatar, queen)."
          actionText="Jelajah Semua Serial Populer"
          actionTo="/browse?category=popular"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
          {items.map((item, idx) => (
            <MovieCard key={`${item.slug}-${idx}`} movie={item} priority={idx < 6} />
          ))}
        </div>
      )}
    </div>
  );
};
