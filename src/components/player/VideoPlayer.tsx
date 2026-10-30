import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server,
  Maximize2,
  SkipForward,
  SkipBack,
  RotateCcw,
  ShieldCheck,
  Tv,
  Check,
  AlertCircle
} from 'lucide-react';
import type { EpisodeStream } from '../../types/movie';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { formatDuration } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface VideoPlayerProps {
  streamData: EpisodeStream;
  seriesSlug: string;
  initialResumeSeconds?: number;
  onEpisodeChange?: (slug: string) => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamData,
  seriesSlug,
  initialResumeSeconds = 0,
  onEpisodeChange,
  className,
}) => {
  const navigate = useNavigate();
  const { saveProgress, getProgressForSeries } = useHistoryStore();

  const servers = streamData.streaming?.servers || [];
  const defaultUrl = streamData.streaming?.defaultStreamUrl || (servers[0]?.url ?? '');

  const [activeServerUrl, setActiveServerUrl] = useState<string>(defaultUrl);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    return localStorage.getItem('cinestream_autoplay') !== 'false';
  });

  // Resume prompt state
  const previousProgress = getProgressForSeries(seriesSlug);
  const resumeSeconds = initialResumeSeconds || (previousProgress?.episodeSlug === streamData.slug ? previousProgress.currentTime : 0);
  const [showResumeBanner, setShowResumeBanner] = useState(resumeSeconds > 60);

  // Simulated elapsed time for progress saving
  const elapsedSecondsRef = useRef<number>(resumeSeconds);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update server URL when streamData changes
  useEffect(() => {
    const newDefault = streamData.streaming?.defaultStreamUrl || (servers[0]?.url ?? '');
    setActiveServerUrl(newDefault);
  }, [streamData.slug]);

  // Periodic watch progress tracker
  useEffect(() => {
    const timer = setInterval(() => {
      elapsedSecondsRef.current += 15;
      const nextTime = elapsedSecondsRef.current;
      // Estimated standard duration 45 mins (2700s) if unknown
      const estimatedDuration = 2700;

      saveProgress({
        seriesSlug,
        episodeSlug: streamData.slug,
        seriesTitle: streamData.series?.title || streamData.title,
        episodeTitle: streamData.title,
        poster: streamData.series?.poster || '',
        season: streamData.season || 1,
        episodeNumber: streamData.episode || 1,
        currentTime: nextTime,
        duration: estimatedDuration,
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [seriesSlug, streamData, saveProgress]);

  const toggleAutoPlay = () => {
    const nextVal = !autoPlayNext;
    setAutoPlayNext(nextVal);
    localStorage.setItem('cinestream_autoplay', String(nextVal));
  };

  const handleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleNavigateEpisode = (epSlug: string | undefined | null) => {
    if (!epSlug) return;
    if (onEpisodeChange) {
      onEpisodeChange(epSlug);
    } else {
      navigate(`/watch/${epSlug}?series=${seriesSlug}`);
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className={cn(
        'relative flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300',
        isTheaterMode ? 'w-full max-w-none col-span-full' : 'w-full',
        className
      )}
    >
      {/* Resume Banner */}
      {showResumeBanner && resumeSeconds > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-200 z-30 animate-in fade-in">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Anda sebelumnya menonton hingga menit <strong>{formatDuration(resumeSeconds)}</strong>. Lanjutkan?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowResumeBanner(false)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Lanjutkan
            </button>
            <button
              onClick={() => {
                elapsedSecondsRef.current = 0;
                setShowResumeBanner(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-colors cursor-pointer"
            >
              Mulai Awal
            </button>
          </div>
        </div>
      )}

      {/* Video Screen (16:9 aspect ratio) */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {activeServerUrl ? (
          <iframe
            ref={iframeRef}
            src={activeServerUrl}
            title={streamData.title}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-sm font-semibold text-slate-200">Sumber streaming tidak tersedia</p>
            <p className="text-xs text-slate-500 mt-1">Silakan coba pilih server alternatif di bawah.</p>
          </div>
        )}
      </div>

      {/* Player Controls & Server Switcher Bar */}
      <div className="p-3 md:p-4 bg-slate-900/95 border-t border-slate-800 flex flex-col gap-3">
        {/* Top bar: Title + Episode Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm md:text-base font-bold text-white truncate">
              {streamData.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Season {streamData.season}</span>
              <span>•</span>
              <span>Episode {streamData.episode}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Subtitle Indonesia
              </span>
            </div>
          </div>

          {/* Episode Prev / Next navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigateEpisode(streamData.navigation?.previous?.slug)}
              disabled={!streamData.navigation?.previous}
              aria-label="Episode Sebelumnya"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700/80 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <button
              onClick={() => handleNavigateEpisode(streamData.navigation?.next?.slug)}
              disabled={!streamData.navigation?.next}
              aria-label="Episode Berikutnya"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-rose-950/30 cursor-pointer"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom bar: Server Switcher + Player View Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Server Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
              <Server className="w-3.5 h-3.5 text-rose-500" /> Server:
            </span>

            {servers.length > 0 ? (
              servers.map((srv, idx) => {
                const isSelected = activeServerUrl === srv.url;
                return (
                  <button
                    key={`${srv.server}-${idx}`}
                    onClick={() => setActiveServerUrl(srv.url)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{srv.server || `Server ${idx + 1}`}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 px-2.5 py-1 rounded-md bg-slate-800">
                Server Utama
              </span>
            )}
          </div>

          {/* Quick utility toggles */}
          <div className="flex items-center gap-3 ml-auto text-xs text-slate-400">
            {/* Autoplay next toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPlayNext}
                onChange={toggleAutoPlay}
                className="w-3.5 h-3.5 accent-rose-600 rounded cursor-pointer"
              />
              <span className="hidden sm:inline text-slate-300">Auto Next</span>
            </label>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              aria-label="Mode Bioskop"
              title="Mode Bioskop / Theater Mode"
              className={cn(
                'p-1.5 rounded-lg border transition-colors cursor-pointer hidden md:flex items-center gap-1',
                isTheaterMode
                  ? 'bg-rose-600/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              )}
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              aria-label="Layar Penuh"
              title="Layar Penuh / Fullscreen"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
