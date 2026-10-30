import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import type { WatchlistItem } from '../types/movie';
import { toast } from './useToastStore';

export function useWatchlistStore() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => storageService.getWatchlist());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<WatchlistItem[]>;
      setWatchlist(customEvent.detail || storageService.getWatchlist());
    };

    window.addEventListener('cinestream_watchlist_change', handleUpdate);
    return () => {
      window.removeEventListener('cinestream_watchlist_change', handleUpdate);
    };
  }, []);

  const addToWatchlist = useCallback((item: WatchlistItem) => {
    const updated = storageService.addToWatchlist(item);
    setWatchlist(updated);
    toast.success(`"${item.title}" ditambahkan ke Watchlist`);
  }, []);

  const removeFromWatchlist = useCallback((slug: string, title?: string) => {
    const updated = storageService.removeFromWatchlist(slug);
    setWatchlist(updated);
    toast.info(`"${title || 'Konten'}" dihapus dari Watchlist`);
  }, []);

  const toggleWatchlist = useCallback(
    (item: WatchlistItem) => {
      const exists = watchlist.some((w) => w.slug === item.slug);
      if (exists) {
        removeFromWatchlist(item.slug, item.title);
      } else {
        addToWatchlist(item);
      }
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  const isInWatchlist = useCallback(
    (slug: string) => watchlist.some((w) => w.slug === slug),
    [watchlist]
  );

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  };
}
