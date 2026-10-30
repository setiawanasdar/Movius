import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Konten',
  message = 'Terjadi kesalahan saat menghubungi server API. Silakan periksa koneksi internet Anda atau coba lagi beberapa saat.',
  onRetry,
  showHomeButton = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 max-w-lg mx-auto my-12 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-5 shadow-inner">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-rose-900/30 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
        )}
        {showHomeButton && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all duration-200 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        )}
      </div>
    </div>
  );
};
