import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import type { SeriesDetail, CatalogItem } from '../types/movie';
import { RatingBadge } from '../components/common/RatingBadge';
import { GenreChip } from '../components/common/GenreChip';
import { SeasonSelector } from '../components/series/SeasonSelector';
import { EpisodeCard } from '../components/series/EpisodeCard';
import { MovieRow } from '../components/common/MovieRow';
import { DetailSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { useWatchlistStore } from '../stores/useWatchlistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getPosterUrl, formatDuration } from '../utils/formatters';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Globe,
  User,
  Users,
  Tv,
  RotateCcw,
  Film
} from 'lucide-react';

export const DetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [related, setRelated] = useState<CatalogItem[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isInWatchlist, toggleWatchlist } = useWatchlistStore();
  const { getProgressForSeries } = useHistoryStore();

  useDocumentTitle(series ? `${series.title} — Movius` : 'Detail Serial');

  const progress = slug ? getProgressForSeries(slug) : undefined;
  const isSaved = slug ? isInWatchlist(slug) : false;

  const loadDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    try {
      const data = await movieApi.getSeriesDetail(slug);
      setSeries(data);
      if (data.seasons && data.seasons.length > 0) {
        setSelectedSeason(data.seasons[0].season);
      }

      // Load related items based on first genre or popular
      movieApi
        .getPopular(1)
        .then((res) => {
          setRelated((res.items || []).filter((item) => item.slug !== slug).slice(0, 10));
        })
        .catch(console.error);
    } catch (err: unknown) {
      setError((err as Error).message || 'Gagal memuat detail serial.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !series) {
    return (
      <div className="pt-28 min-h-[60vh] flex items-center justify-center">
        <ErrorState onRetry={loadDetail} message={error || 'Serial tidak ditemukan'} />
      </div>
    );
  }

  const isMovie = Boolean(
    series.isMovie ||
    series.metadata?.status?.toLowerCase().includes('movie') ||
    series.metadata?.totalEpisodes === 1 ||
    (!series.metadata?.totalEpisodes && (!series.seasons || series.seasons.length <= 1) && series.seasons?.[0]?.episodes?.length === 1)
  );

  const currentSeasonData =
    series.seasons?.find((s) => s.season === selectedSeason) || series.seasons?.[0];
  const firstEpisodeSlug =
    series.seasons?.[0]?.episodes?.[0]?.slug || (isMovie ? series.slug : `${series.slug}-season-1-episode-1`);

  const handleToggleWatchlist = () => {
    toggleWatchlist({
      slug: series.slug,
      title: series.title,
      poster: series.poster,
      rating: series.rating,
      year: series.year,
      genres: series.metadata?.genres || [],
      status: isMovie ? 'Full Movie' : (series.metadata?.status || 'Ongoing'),
      totalEpisodes: isMovie ? 1 : series.metadata?.totalEpisodes,
      addedAt: Date.now(),
    });
  };

  return (
    <div className="flex flex-col pb-20">
      {/* Big Cinematic Backdrop Area */}
      <div className="relative w-full min-h-[460px] md:min-h-[560px] bg-slate-950 overflow-hidden">
        {/* Backdrop Blurred Artwork */}
        <div className="absolute inset-0">
          <img
            src={getPosterUrl(series.poster)}
            alt={series.title}
            className="w-full h-full object-cover object-center filter blur-2xl scale-125 opacity-25"
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent z-10" />

        {/* Detail Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-8 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Box */}
          <div className="w-[180px] sm:w-[220px] md:w-[260px] shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[2/3] bg-slate-900 group">
            <img
              src={getPosterUrl(series.poster)}
              alt={series.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Info Column */}
          <div className="flex flex-col flex-1 gap-4">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-rose-600 font-bold text-white uppercase text-[10px] tracking-wider">
                {isMovie ? 'FILM BIOSKOP' : (series.metadata?.status || 'SERIAL TV')}
              </span>
              {series.rating && <RatingBadge rating={series.rating} size="md" />}
              {series.year && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {series.year}
                </span>
              )}
              {series.metadata?.country && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {series.metadata.country}
                </span>
              )}
              {isMovie ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium">
                  <Film className="w-3.5 h-3.5 text-emerald-400" />
                  Full Movie
                </span>
              ) : series.metadata?.totalEpisodes ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200">
                  <Tv className="w-3.5 h-3.5 text-slate-400" />
                  {series.metadata.totalEpisodes} Episode
                </span>
              ) : null}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {series.title}
              </h1>
              {series.fullTitle && series.fullTitle !== series.title && (
                <p className="text-xs md:text-sm text-slate-400 mt-1 italic">
                  {series.fullTitle}
                </p>
              )}
            </div>

            {/* Genres */}
            {series.metadata?.genres && series.metadata.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {series.metadata.genres.map((g) => (
                  <GenreChip
                    key={g}
                    genre={g}
                    size="sm"
                    onClick={() => navigate(`/browse?genre=${encodeURIComponent(g.toLowerCase())}`)}
                  />
                ))}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {progress ? (
                <Link
                  to={`/watch/${progress.episodeSlug}?series=${series.slug}&resumeTime=${Math.floor(
                    progress.currentTime
                  )}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm md:text-base shadow-xl shadow-amber-950/40 transition-all active:scale-95"
                >
                  <RotateCcw className="w-5 h-5 text-slate-950" />
                  <span>
                    {isMovie ? 'Lanjutkan Menonton' : `Lanjutkan Ep ${progress.episodeNumber}`} ({formatDuration(progress.currentTime)})
                  </span>
                </Link>
              ) : (
                <Link
                  to={`/watch/${firstEpisodeSlug}?series=${series.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm md:text-base shadow-xl shadow-rose-950/40 transition-all active:scale-95"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>{isMovie ? 'Putar Film (Full Movie)' : 'Mulai Nonton Episode 1'}</span>
                </Link>
              )}

              <button
                onClick={handleToggleWatchlist}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-sm md:text-base border border-slate-700/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-5 h-5 text-rose-500 fill-rose-500" />
                    <span>Tersimpan di Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-5 h-5" />
                    <span>Tambah ke Watchlist</span>
                  </>
                )}
              </button>
            </div>

            {/* Cast & Director Metadata */}
            <div className="flex flex-col gap-2 pt-2 text-xs md:text-sm text-slate-300 border-t border-white/10 mt-2">
              {series.metadata?.director && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-400">Sutradara:</span>
                  <span className="font-semibold text-white">{series.metadata.director}</span>
                </div>
              )}

              {series.metadata?.cast && series.metadata.cast.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-400 shrink-0">Pemeran:</span>
                  <div className="flex flex-wrap gap-1 text-slate-200">
                    {series.metadata.cast.map((c, i) => (
                      <span key={i}>
                        {c}
                        {i < (series.metadata.cast?.length ?? 0) - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex flex-col gap-8 mt-4">
        {/* Synopsis Section */}
        {series.synopsis && (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-rose-600 rounded-full inline-block" />
              Sinopsis Cerita
            </h3>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {series.synopsis}
            </p>
          </div>
        )}

        {/* Season & Episode List Section or Full Movie Cinema Card */}
        {isMovie ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-rose-600 rounded-full inline-block" />
              Format Tayangan Penuh (Full Cinema)
            </h3>
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                    Full Movie HD
                  </span>
                  <span className="text-xs text-slate-400 font-medium">1 Part Lengkap • Bebas Iklan</span>
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-white">{series.title}</h4>
                <p className="text-xs md:text-sm text-slate-300 max-w-xl">
                  Film berdurasi penuh dengan dukungan multi-server berkecepatan tinggi, resolusi Full HD, dan subtitle resmi Bahasa Indonesia.
                </p>
              </div>
              <Link
                to={`/watch/${firstEpisodeSlug}?series=${series.slug}`}
                className="shrink-0 inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-xl shadow-rose-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Tonton Film Sekarang</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-rose-600 rounded-full inline-block" />
                Daftar Episode
              </h3>
              <span className="text-xs text-slate-400">
                Total {currentSeasonData?.episodes?.length || 0} episode tersedia
              </span>
            </div>

            {/* Season Selector */}
            <SeasonSelector
              seasons={series.seasons || []}
              selectedSeason={selectedSeason}
              onSelectSeason={setSelectedSeason}
            />

            {/* Episodes Grid */}
            {currentSeasonData && currentSeasonData.episodes?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentSeasonData.episodes.map((ep) => {
                  const isEpisodeWatched = progress?.episodeSlug === ep.slug;
                  return (
                    <EpisodeCard
                      key={ep.slug}
                      episode={ep}
                      seriesSlug={series.slug}
                      isWatched={isEpisodeWatched}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                Belum ada episode yang terdaftar untuk musim ini.
              </div>
            )}
          </div>
        )}

        {/* Related / Recommended Series Row */}
        {related.length > 0 && (
          <div className="pt-6 border-t border-slate-800/80">
            <MovieRow
              title={isMovie ? 'Film Terkait & Rekomendasi' : 'Serial Terkait & Rekomendasi'}
              subtitle="Tontonan serupa yang mungkin Anda sukai"
              items={related}
            />
          </div>
        )}
      </div>
    </div>
  );
};
