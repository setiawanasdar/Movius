import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Loader2, Film, Clock } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { movieApi } from '../../api/movieApi';
import type { CatalogItem } from '../../types/movie';
import { RatingBadge } from './RatingBadge';
import { storageService } from '../../services/storageService';
import { getPosterUrl } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface SearchBarProps {
  initialValue?: string;
  autoFocus?: boolean;
  onSearchSubmit?: (query: string) => void;
  className?: string;
  isHeaderVariant?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  autoFocus = false,
  onSearchSubmit,
  className,
  isHeaderVariant = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 350);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentQueries(storageService.getSearchHistory().slice(0, 5));
  }, []);

  // Sync initial query
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results on debounced query
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    movieApi
      .search(trimmed, 1, controller.signal)
      .then((res) => {
        setResults(res.items || []);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    storageService.addSearchQuery(trimmed);
    setRecentQueries(storageService.getSearchHistory().slice(0, 5));
    setIsOpen(false);

    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      navigate(`/search?keyword=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectRecent = (q: string) => {
    setQuery(q);
    storageService.addSearchQuery(q);
    setIsOpen(false);
    navigate(`/search?keyword=${encodeURIComponent(q)}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Cari film, serial, drakor..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
          />

          {isLoading ? (
            <Loader2 className="absolute right-3.5 w-4 h-4 text-rose-500 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Bersihkan pencarian"
              className="absolute right-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Dropdown Suggestions (for Header or Quick search) */}
      {isHeaderVariant && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden z-50 max-h-[420px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {/* Recent searches if query is empty */}
          {!query && recentQueries.length > 0 && (
            <div className="p-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                Pencarian Terakhir
              </div>
              <div className="flex flex-col gap-1">
                {recentQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSelectRecent(q)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results list */}
          {query.trim().length >= 2 && (
            <div className="p-2">
              {results.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Hasil Rekomendasi
                  </div>
                  {results.slice(0, 6).map((item) => (
                    <div
                      key={item.slug}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/series/${item.slug}`);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <img
                        src={getPosterUrl(item.poster)}
                        alt={item.title}
                        className="w-10 h-14 rounded-lg object-cover bg-slate-800 shrink-0"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-rose-400 transition-colors truncate">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {item.rating && <RatingBadge rating={item.rating} size="sm" />}
                          <span>{item.year || 'Series'}</span>
                          {item.isComplete ? (
                            <span className="text-emerald-400 font-medium">Tamat</span>
                          ) : (
                            <span className="text-rose-400 font-medium">Ongoing</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleSubmit()}
                    className="w-full mt-2 py-2 text-center text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    Lihat semua hasil untuk "{query}"
                  </button>
                </div>
              ) : !isLoading ? (
                <div className="p-6 text-center text-slate-400">
                  <Film className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs">Tidak ditemukan serial dengan kata kunci tersebut.</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
