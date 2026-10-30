import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import type { CatalogItem, GenreItem } from '../types/movie';
import { HeroBanner } from '../components/common/HeroBanner';
import { MovieRow } from '../components/common/MovieRow';
import { ContinueWatchingRow } from '../components/history/ContinueWatchingRow';
import { GenreChip } from '../components/common/GenreChip';
import { ErrorState } from '../components/common/ErrorState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Compass } from 'lucide-react';

export const HomePage: React.FC = () => {
  useDocumentTitle('Movius — Nonton Film & Drama Subtitle Indonesia');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [popularItems, setPopularItems] = useState<CatalogItem[]>([]);
  const [latestItems, setLatestItems] = useState<CatalogItem[]>([]);
  const [drakorItems, setDrakorItems] = useState<CatalogItem[]>([]);
  const [ongoingItems, setOngoingItems] = useState<CatalogItem[]>([]);
  const [completedItems, setCompletedItems] = useState<CatalogItem[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [popRes, latestRes, drakorRes, ongoingRes, completedRes, genreList] =
        await Promise.allSettled([
          movieApi.getPopular(1),
          movieApi.getLatest(1),
          movieApi.getDrakor(1),
          movieApi.getOngoing(1),
          movieApi.getCompleted(1),
          movieApi.getGenres(),
        ]);

      if (popRes.status === 'fulfilled') setPopularItems(popRes.value.items || []);
      if (latestRes.status === 'fulfilled') setLatestItems(latestRes.value.items || []);
      if (drakorRes.status === 'fulfilled') setDrakorItems(drakorRes.value.items || []);
      if (ongoingRes.status === 'fulfilled') setOngoingItems(ongoingRes.value.items || []);
      if (completedRes.status === 'fulfilled') setCompletedItems(completedRes.value.items || []);
      if (genreList.status === 'fulfilled') setGenres(genreList.value || []);

      // If all failed, trigger error state
      if (
        popRes.status === 'rejected' &&
        latestRes.status === 'rejected' &&
        drakorRes.status === 'rejected'
      ) {
        throw new Error('Gagal memuat katalog streaming.');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Gagal memuat konten streaming.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error && popularItems.length === 0) {
    return (
      <div className="pt-24 min-h-[70vh] flex items-center justify-center">
        <ErrorState onRetry={loadData} message={error} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:gap-4 pb-16">
      {/* 1. Hero Showcase Carousel */}
      <HeroBanner items={popularItems} loading={loading} />

      {/* 2. Continue Watching (if user has watch progress) */}
      <ContinueWatchingRow />

      {/* 3. Trending / Top Hari Ini */}
      <MovieRow
        title="Top & Populer Hari Ini"
        subtitle="Serial paling banyak ditonton minggu ini"
        items={popularItems}
        loading={loading}
        viewAllLink="/browse?category=popular"
      />

      {/* 4. Korean Drama (Drakor) Spotlight */}
      <div className="relative py-2">
        <MovieRow
          title="Maraton Drama Korea (Drakor)"
          subtitle="Serial drakor sub Indo terlengkap dan paling trending"
          items={drakorItems}
          loading={loading}
          viewAllLink="/browse?category=drakor"
        />
      </div>

      {/* 5. Quick Genre Filter Section */}
      {genres.length > 0 && (
        <section className="px-4 md:px-8 py-4">
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/80 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-100 text-sm md:text-base">
                  Jelajah Berdasarkan Genre
                </h3>
              </div>
              <span className="text-xs text-slate-400">Pilih tema favorit Anda</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {genres.map((g) => (
                <GenreChip
                  key={g.slug}
                  genre={g.name}
                  size="sm"
                  onClick={() => navigate(`/browse?genre=${g.slug}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Rilis Terbaru (Latest Releases & Episodes) */}
      <MovieRow
        title="Rilis Terbaru"
        subtitle="Update episode dan judul baru yang baru saja tayang"
        items={latestItems}
        loading={loading}
        viewAllLink="/browse?category=latest"
      />

      {/* 7. Ongoing Series */}
      <MovieRow
        title="Serial Ongoing Sedang Tayang"
        subtitle="Ikuti episode terbarunya setiap minggu"
        items={ongoingItems}
        loading={loading}
        viewAllLink="/browse?category=ongoing"
      />

      {/* 8. Completed / Tamat */}
      <MovieRow
        title="Serial Komplit & Tamat"
        subtitle="Tonton maraton tanpa harus menunggu episode baru"
        items={completedItems}
        loading={loading}
        viewAllLink="/browse?category=completed"
      />
    </div>
  );
};
