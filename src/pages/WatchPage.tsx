import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import type { EpisodeStream, SeriesDetail } from '../types/movie';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { EpisodeCard } from '../components/series/EpisodeCard';
import { RatingBadge } from '../components/common/RatingBadge';
import { ErrorState } from '../components/common/ErrorState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ChevronLeft, ListFilter, Film, ShieldCheck, Info, User, Users } from 'lucide-react';

export const WatchPage: React.FC = () => {
  const { episodeSlug } = useParams<{ episodeSlug: string }>();
  const [searchParams] = useSearchParams();
  const seriesSlugParam = searchParams.get('series') || '';
  const resumeParam = searchParams.get('resumeTime');
  const initialResume = resumeParam ? parseInt(resumeParam, 10) : 0;

  const navigate = useNavigate();

  const [streamData, setStreamData] = useState<EpisodeStream | null>(null);
  const [seriesData, setSeriesData] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(
    streamData
      ? `Nonton: ${streamData.title} — Movius`
      : 'Memuat Pemutar Video — Movius'
  );

  const loadStream = useCallback(async () => {
    if (!episodeSlug) return;
    setLoading(true);
    setError(null);

    try {
      const data = await movieApi.getEpisodeStream(episodeSlug);
      setStreamData(data);

      const targetSeriesSlug = seriesSlugParam || data.series?.slug;
      if (targetSeriesSlug) {
        movieApi
          .getSeriesDetail(targetSeriesSlug)
          .then(setSeriesData)
          .catch(console.error);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Gagal memuat player video streaming.');
    } finally {
      setLoading(false);
    }
  }, [episodeSlug, seriesSlugParam]);

  useEffect(() => {
    loadStream();
  }, [loadStream]);

  if (loading) {
    return (
      <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6 animate-pulse">
        <div className="h-6 w-32 rounded bg-slate-800" />
        <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800" />
        <div className="h-20 w-full rounded-xl bg-slate-900" />
      </div>
    );
  }

  if (error || !streamData) {
    return (
      <div className="pt-28 min-h-[60vh] flex items-center justify-center">
        <ErrorState onRetry={loadStream} message={error || 'Episode tidak ditemukan'} />
      </div>
    );
  }

  const activeSeriesSlug = seriesSlugParam || streamData.series?.slug || '';
  const isMovie = Boolean(
    streamData.isMovie ||
    streamData.series?.isMovie ||
    seriesData?.isMovie ||
    seriesData?.metadata?.totalEpisodes === 1 ||
    (!streamData.navigation?.previous && !streamData.navigation?.next && (!seriesData?.seasons || seriesData.seasons.length <= 1) && (seriesData?.seasons?.[0]?.episodes?.length || 0) <= 1)
  );

  const currentSeasonEpisodes =
    seriesData?.seasons?.find((s) => s.season === streamData.season)?.episodes ||
    seriesData?.seasons?.[0]?.episodes ||
    [];

  return (
    <div className="pt-20 md:pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Back to Series / Movie link */}
      <div className="flex items-center justify-between">
        <Link
          to={`/series/${activeSeriesSlug}`}
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Detail {isMovie ? 'Film' : (streamData.series?.title || 'Serial')}</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" /> Subtitle Indonesia Aktif
        </span>
      </div>

      {/* Main Layout: Video Player + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Player & Overview */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <VideoPlayer
            streamData={streamData}
            seriesSlug={activeSeriesSlug}
            initialResumeSeconds={initialResume}
            onEpisodeChange={(newSlug) => {
              navigate(`/watch/${newSlug}?series=${activeSeriesSlug}`);
            }}
          />

          {/* Series / Movie Info Card below player */}
          <div className="p-5 md:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {streamData.series?.title || streamData.title}
              </h2>
              {streamData.series?.rating && (
                <RatingBadge rating={streamData.series.rating} size="sm" />
              )}
            </div>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Anda sedang menonton <strong>{streamData.title}</strong> dalam resolusi Full HD
              lengkap dengan terjemahan subtitle Bahasa Indonesia resmi. Gunakan pilihan tombol server jika
              video lambat atau mengalami buffering.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Tahun: {streamData.series?.year || '2026'}</span>
              <span>•</span>
              {isMovie ? (
                <>
                  <span className="text-rose-400 font-semibold">Format: Film Layar Lebar</span>
                  <span>•</span>
                  <span>Status: Full Movie (1 Part)</span>
                </>
              ) : (
                <>
                  <span>Season {streamData.season}</span>
                  <span>•</span>
                  <span>Episode {streamData.episode}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Episode List Sidebar for Series OR Film Overview for Movies */}
        {isMovie ? (
          <div className="flex flex-col gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Info className="w-4 h-4 text-rose-500" />
              <h4 className="text-sm font-bold text-white">Informasi Film</h4>
            </div>

            {seriesData?.synopsis && (
              <div className="flex flex-col gap-1 text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Sinopsis:</span>
                <p className="line-clamp-6 leading-relaxed text-slate-300">{seriesData.synopsis}</p>
              </div>
            )}

            {seriesData?.metadata?.director && (
              <div className="flex items-center gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Sutradara:</span>
                <span className="font-medium text-white">{seriesData.metadata.director}</span>
              </div>
            )}

            {seriesData?.metadata?.cast && seriesData.metadata.cast.length > 0 && (
              <div className="flex flex-col gap-1 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>Pemeran Utama:</span>
                </div>
                <div className="flex flex-wrap gap-1 text-slate-200">
                  {seriesData.metadata.cast.slice(0, 5).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800/80 text-[11px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {seriesData?.metadata?.genres && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                {seriesData.metadata.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full bg-rose-600/10 border border-rose-500/20 text-rose-400 text-[11px] font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800">
              <Link
                to={`/series/${activeSeriesSlug}`}
                className="w-full inline-flex items-center justify-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Lihat Halaman Lengkap Film
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 max-h-[700px] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-rose-500" />
                <span>Episode Musim {streamData.season}</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {currentSeasonEpisodes.length} Episode
              </span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-1">
              {currentSeasonEpisodes.length > 0 ? (
                currentSeasonEpisodes.map((ep) => (
                  <EpisodeCard
                    key={ep.slug}
                    episode={ep}
                    seriesSlug={activeSeriesSlug}
                    isActive={ep.slug === episodeSlug}
                  />
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <Film className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  Episode lainnya dapat dilihat pada halaman detail serial.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
