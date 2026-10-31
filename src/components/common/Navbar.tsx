import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Compass, Bookmark, History, Menu, X, Flame, Sparkles } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useWatchlistStore } from '../../stores/useWatchlistStore';
import { cn } from '../../utils/cn';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { watchlist } = useWatchlistStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Beranda', to: '/' },
    { label: 'Populer', to: '/browse?category=popular', icon: Flame },
    { label: 'Drakor', to: '/browse?category=drakor', icon: Sparkles },
    { label: 'Terbaru', to: '/browse?category=latest' },
    { label: 'Jelajah', to: '/browse', icon: Compass },
    { label: 'Watchlist', to: '/watchlist', badge: watchlist.length, icon: Bookmark },
    { label: 'Riwayat', to: '/history', icon: History },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-[#090a0f] border-b border-slate-800 shadow-2xl py-3'
          : 'bg-[#090a0f] border-b border-slate-800/80 shadow-lg shadow-black/50 py-3.5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-700 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white flex items-center">
                Mov<span className="text-rose-500">ius</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-black text-rose-400">
                4.427 Judul
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase -mt-0.5">
              Koleksi Lengkap • Sub Indo
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 ml-4">
          {navLinks.map((link) => {
            const isActive =
              link.to === '/'
                ? location.pathname === '/' && !location.search
                : location.pathname + location.search === link.to ||
                  (link.to === '/browse' && location.pathname === '/browse' && !location.search);

            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                  isActive
                    ? 'text-white bg-white/10 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                )}
              >
                {link.icon && <link.icon className="w-3.5 h-3.5" />}
                <span>{link.label}</span>
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="hidden sm:block max-w-xs md:max-w-sm w-full ml-auto">
          <SearchBar isHeaderVariant />
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/search"
            aria-label="Pencarian"
            className="sm:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/60"
          >
            <Compass className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-[#090a0f]/98 backdrop-blur-2xl border-b border-slate-800 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200 shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="sm:hidden pb-2">
            <SearchBar isHeaderVariant onSearchSubmit={() => setIsMobileMenuOpen(false)} />
          </div>

          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/' && !location.search
                  : location.pathname + location.search === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {link.icon && <link.icon className="w-4 h-4" />}
                    <span>{link.label}</span>
                  </div>
                  {typeof link.badge === 'number' && link.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
