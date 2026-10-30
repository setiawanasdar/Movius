import React from 'react';
import { useToastStore, type ToastType } from '../../stores/useToastStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
};

const BORDERS: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-950/80',
  error: 'border-rose-500/30 bg-rose-950/80',
  warning: 'border-amber-500/30 bg-amber-950/80',
  info: 'border-sky-500/30 bg-sky-950/80',
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm text-slate-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3',
            BORDERS[t.type]
          )}
        >
          <div className="flex items-center gap-3">
            {ICONS[t.type]}
            <p className="font-medium text-xs md:text-sm leading-snug">{t.message}</p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Tutup notifikasi"
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
