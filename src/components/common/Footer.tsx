import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, ShieldCheck, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/70 pt-12 pb-24 md:pb-12 text-slate-400 text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <Film className="w-4 h-4 fill-white/20" />
              </div>
              <span className="text-lg font-black text-white">
                Mov<span className="text-rose-500">ius</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Platform katalog streaming serial TV, drama korea (drakor), dan film dengan subtitle Bahasa Indonesia terupdate. Menghadirkan antarmuka modern yang cepat, elegan, dan nyaman ditonton.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Multi-Server Fast Streaming
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Subtitle Indonesia
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-2.5">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Kategori Populer
            </h5>
            <Link to="/browse?category=drakor" className="hover:text-rose-400 transition-colors">
              Drama Korea (Drakor)
            </Link>
            <Link to="/browse?category=popular" className="hover:text-rose-400 transition-colors">
              Serial Top Hari Ini
            </Link>
            <Link to="/browse?category=latest" className="hover:text-rose-400 transition-colors">
              Rilis Episode Terbaru
            </Link>
            <Link to="/browse?category=completed" className="hover:text-rose-400 transition-colors">
              Serial Komplit / Tamat
            </Link>
          </div>

          {/* Navigation links */}
          <div className="flex flex-col gap-2.5">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Fitur Pengguna
            </h5>
            <Link to="/watchlist" className="hover:text-rose-400 transition-colors">
              Daftar Tontonan (Watchlist)
            </Link>
            <Link to="/history" className="hover:text-rose-400 transition-colors">
              Riwayat Tontonan & Progres
            </Link>
            <Link to="/search" className="hover:text-rose-400 transition-colors">
              Pencarian Cepat
            </Link>
            <Link to="/browse" className="hover:text-rose-400 transition-colors">
              Filter Genre & Negara
            </Link>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>
            Disclaimer: Seluruh konten dan media diindeks dari penyedia pihak ketiga publik. Movius tidak menyimpan video di servernya.
          </p>
          <p className="flex items-center gap-1 shrink-0">
            Dibuat dengan <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> untuk pecinta film sub Indo
          </p>
        </div>
      </div>
    </footer>
  );
};
