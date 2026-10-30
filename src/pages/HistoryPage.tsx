import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistoryStore } from '../stores/useHistoryStore';
import { EmptyState } from '../components/common/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDuration, formatRelativeTime, getPosterUrl } from '../utils/formatters';
import { History, Play, Trash2, X, RotateCcw } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  useDocumentTitle('Riwayat Tontonan & Progres — Movius');
  const { history, removeFromHistory, clearHistory } = useHistoryStore();
  const navigate = useNavigate();

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-amber-400" />
            <span>Riwayat Tontonan</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lihat daftar tontonan yang pernah Anda putar dan lanjutkan episode terakhir kapan saja.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin menghapus semua riwayat tontonan?')) {
                clearHistory();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Semua</span>
          </button>
        )}
      </div>

      {/* List or Empty */}
      {history.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-amber-400" />}
          title="Belum Ada Riwayat Tontonan"
          description="Saat Anda memutar sebuah episode film atau serial, progres menonton Anda akan tersimpan otomatis di sini."
          actionText="Mulai Nonton Sekarang"
          actionTo="/"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 group shadow-lg"
            >
              {/* Video Thumbnail */}
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

                <div className="absolute inset-0 bg-slate-950/30" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform pl-0.5">
                    <Play className="w-5 h-5 fill-white" />
                  </div>
                </div>

                {/* Remove single item button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item.seriesSlug, item.seriesTitle);
                  }}
                  aria-label="Hapus dari riwayat"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Progress bar */}
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
                  <div
                    className="h-full bg-amber-500 rounded-r-full"
                    style={{ width: `${Math.max(5, item.percentage || 0)}%` }}
                  />
                </div>
              </div>

              {/* Info text */}
              <div className="p-4 flex flex-col gap-2">
                <div>
                  <h4
                    title={item.seriesTitle}
                    className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors"
                  >
                    {item.seriesTitle}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Season {item.season} • Episode {item.episodeNumber}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <RotateCcw className="w-3 h-3" />
                    {formatDuration(item.currentTime)}
                  </span>
                  <span>{formatRelativeTime(item.updatedAt)}</span>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/watch/${item.episodeSlug}?series=${item.seriesSlug}&resumeTime=${Math.floor(
                        item.currentTime
                      )}`
                    )
                  }
                  className="w-full mt-1 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Lanjutkan Menonton</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
