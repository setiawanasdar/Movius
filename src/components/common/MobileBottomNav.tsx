import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Search, Bookmark, History } from 'lucide-react';
import { useWatchlistStore } from '../../stores/useWatchlistStore';
import { cn } from '../../utils/cn';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { watchlist } = useWatchlistStore();

  const tabs = [
    { label: 'Beranda', to: '/', icon: Home },
    { label: 'Drakor', to: '/browse?category=drakor', icon: Sparkles },
    { label: 'Cari', to: '/search', icon: Search },
    { label: 'Watchlist', to: '/watchlist', icon: Bookmark, badge: watchlist.length },
    { label: 'Riwayat', to: '/history', icon: History },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#090a0f]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-2 select-none">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.to === '/'
              ? location.pathname === '/' && !location.search
              : location.pathname + location.search === tab.to ||
                (tab.to === '/search' && location.pathname === '/search');

          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-90',
                isActive ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-600 text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
