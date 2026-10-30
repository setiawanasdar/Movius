import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import type { CatalogItem, GenreItem, CountryItem, CatalogCategory } from '../types/movie';
import { MovieCard } from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Filter, Layers, RefreshCcw } from 'lucide-react';
import { cn } from '../utils/cn';

const CATEGORIES: { id: CatalogCategory; label: string }[] = [
  { id: 'popular', label: 'Top & Populer' },
  { id: 'latest', label: 'Rilis Terbaru' },
  { id: 'drakor', label: 'Drama Korea' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Tamat' },
  { id: 'asian', label: 'Asia' },
  { id: 'west', label: 'Western' },
];

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

export const BrowsePage: React.FC = () => {
  useDocumentTitle('Katalog Film & Serial TV — Movius');
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = (searchParams.get('category') as CatalogCategory) || 'popular';
  const genreParam = searchParams.get('genre') || '';
  const countryParam = searchParams.get('country') || '';
  const yearParam = searchParams.get('year') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);

  // Load filter metadata
  useEffect(() => {
    movieApi.getGenres().then(setGenres).catch(console.error);
    movieApi.getCountries().then(setCountries).catch(console.error);
  }, []);

  // Fetch catalog according to query params
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let res;
      if (genreParam) {
        res = await movieApi.getByGenre(genreParam, pageParam);
      } else if (countryParam) {
        res = await movieApi.getByCountry(countryParam, pageParam);
      } else if (yearParam) {
        res = await movieApi.getByYear(yearParam, pageParam);
      } else {
        res = await movieApi.getByCategory(categoryParam, pageParam);
      }

      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.count || (res.items?.length ?? 0));
    } catch (err: unknown) {
      setError((err as Error).message || 'Gagal mengambil daftar katalog.');
    } finally {
      setLoading(false);
    }
  }, [categoryParam, genreParam, countryParam, yearParam, pageParam]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // If setting genre, clear category/country/year to keep filters focused
    if (key === 'genre') {
      next.delete('country');
      next.delete('year');
      next.delete('category');
    } else if (key === 'country') {
      next.delete('genre');
      next.delete('year');
      next.delete('category');
    } else if (key === 'year') {
      next.delete('genre');
      next.delete('country');
      next.delete('category');
    } else if (key === 'category') {
      next.delete('genre');
      next.delete('country');
      next.delete('year');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({ category: 'popular', page: '1' });
  };

  const hasActiveFilters = Boolean(genreParam || countryParam || yearParam);

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-7 h-7 text-rose-500" />
          <span>Jelajah Katalog Streaming</span>
        </h1>
        <p className="text-sm text-slate-400">
          Filter ribuan episode drama korea, serial TV, dan film sub Indo terlengkap.
        </p>
      </div>

      {/* Category Pills (Primary) */}
      {!hasActiveFilters && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = categoryParam === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => updateParam('category', cat.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Secondary Filter Dropdowns Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mr-2">
          <Filter className="w-4 h-4 text-rose-500" />
          <span>Filter Lanjutan:</span>
        </div>

        {/* Genre Selector */}
        <select
          value={genreParam}
          onChange={(e) => updateParam('genre', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer"
        >
          <option value="">Semua Genre</option>
          {genres.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Country Selector */}
        <select
          value={countryParam}
          onChange={(e) => updateParam('country', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer"
        >
          <option value="">Semua Negara</option>
          {countries.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Year Selector */}
        <select
          value={yearParam}
          onChange={(e) => updateParam('year', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer"
        >
          <option value="">Semua Tahun</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 transition-colors ml-auto cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Menampilkan{' '}
          <strong className="text-slate-200">{totalCount || items.length}</strong> serial{' '}
          {hasActiveFilters && '(terfilter)'}
        </span>
        {totalPages > 1 && (
          <span>
            Halaman {pageParam} dari {totalPages}
          </span>
        )}
      </div>

      {/* Grid Content / Skeletons / Error */}
      {error ? (
        <ErrorState onRetry={fetchCatalog} message={error} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
          {Array.from({ length: 18 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Tidak Ada Serial Ditemukan"
          description="Coba ubah kombinasi filter atau kembali ke kategori populer."
          actionText="Kembali ke Top Populer"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
          {items.map((item, idx) => (
            <MovieCard key={`${item.slug}-${idx}`} movie={item} priority={idx < 6} />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
