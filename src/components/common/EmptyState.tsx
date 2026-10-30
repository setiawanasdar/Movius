import React from 'react';
import { Film, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  actionTo?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'Tidak Ada Konten',
  description = 'Belum ada film atau serial yang cocok dengan kriteria ini.',
  actionText = 'Jelajahi Konten Populer',
  actionTo = '/browse',
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-14 max-w-md mx-auto my-12 rounded-2xl bg-slate-900/30 border border-slate-800/60">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-5 shadow-inner">
        {icon || <Film className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
      {onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      ) : actionTo ? (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-rose-900/25 active:scale-95"
        >
          <Compass className="w-4 h-4" />
          <span>{actionText}</span>
        </Link>
      ) : null}
    </div>
  );
};
