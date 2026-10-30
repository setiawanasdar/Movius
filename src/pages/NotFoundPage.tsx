import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, Compass } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const NotFoundPage: React.FC = () => {
  useDocumentTitle('404 Halaman Tidak Ditemukan — Movius');

  return (
    <div className="pt-28 pb-20 px-4 min-h-[75vh] flex items-center justify-center">
      <div className="max-w-md w-full flex flex-col items-center text-center p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6 shadow-inner">
          <Film className="w-10 h-10" />
        </div>

        <span className="text-5xl font-black text-rose-500 tracking-tight mb-2">404</span>
        <h2 className="text-xl font-bold text-white mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Maaf, halaman film atau serial yang Anda tuju mungkin sudah dipindahkan, dihapus, atau alamat URL salah ketik.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-950/40"
          >
            <Home className="w-4 h-4" />
            <span>Ke Beranda</span>
          </Link>
          <Link
            to="/browse"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Jelajah Film</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
