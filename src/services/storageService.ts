import type { WatchHistoryItem, WatchlistItem } from '../types/movie';

const KEYS = {
  WATCHLIST: 'cinestream_watchlist_v1',
  HISTORY: 'cinestream_history_v1',
  SEARCH_HISTORY: 'cinestream_search_history_v1',
  SETTINGS: 'cinestream_settings_v1',
};

export const storageService = {
  // ==================== WATCHLIST ====================
  getWatchlist(): WatchlistItem[] {
    try {
      const data = localStorage.getItem(KEYS.WATCHLIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed reading watchlist from storage:', e);
      return [];
    }
  },

  addToWatchlist(item: WatchlistItem): WatchlistItem[] {
    try {
      const current = storageService.getWatchlist();
      const exists = current.some((w) => w.slug === item.slug);
      let updated: WatchlistItem[];
      if (exists) {
        updated = current.map((w) => (w.slug === item.slug ? { ...item, addedAt: Date.now() } : w));
      } else {
        updated = [{ ...item, addedAt: Date.now() }, ...current];
      }
      localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cinestream_watchlist_change', { detail: updated }));
      return updated;
    } catch (e) {
      console.error('Failed saving to watchlist:', e);
      return storageService.getWatchlist();
    }
  },

  removeFromWatchlist(slug: string): WatchlistItem[] {
    try {
      const current = storageService.getWatchlist();
      const updated = current.filter((w) => w.slug !== slug);
      localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cinestream_watchlist_change', { detail: updated }));
      return updated;
    } catch (e) {
      console.error('Failed removing from watchlist:', e);
      return storageService.getWatchlist();
    }
  },

  isInWatchlist(slug: string): boolean {
    const list = storageService.getWatchlist();
    return list.some((w) => w.slug === slug);
  },

  // ==================== WATCH HISTORY & CONTINUE WATCHING ====================
  getHistory(): WatchHistoryItem[] {
    try {
      const data = localStorage.getItem(KEYS.HISTORY);
      const items: WatchHistoryItem[] = data ? JSON.parse(data) : [];
      // Sort newest first
      return items.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
      console.error('Failed reading history from storage:', e);
      return [];
    }
  },

  getHistoryItem(seriesSlug: string): WatchHistoryItem | undefined {
    const list = storageService.getHistory();
    return list.find((h) => h.seriesSlug === seriesSlug);
  },

  saveHistory(item: Omit<WatchHistoryItem, 'id' | 'updatedAt' | 'percentage'>): WatchHistoryItem {
    try {
      const list = storageService.getHistory();
      const id = `${item.seriesSlug}-${item.episodeSlug}`;
      const percentage = item.duration > 0 ? Math.min(100, Math.round((item.currentTime / item.duration) * 100)) : 0;

      const record: WatchHistoryItem = {
        ...item,
        id,
        percentage,
        updatedAt: Date.now(),
      };

      // Filter out existing record for this series so it floats to the top
      const filtered = list.filter((h) => h.seriesSlug !== item.seriesSlug);
      const updated = [record, ...filtered].slice(0, 50); // limit to last 50 items

      localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cinestream_history_change', { detail: updated }));
      return record;
    } catch (e) {
      console.error('Failed saving watch history:', e);
      return {
        ...item,
        id: `${item.seriesSlug}-${item.episodeSlug}`,
        percentage: 0,
        updatedAt: Date.now(),
      };
    }
  },

  removeFromHistory(seriesSlug: string): WatchHistoryItem[] {
    try {
      const list = storageService.getHistory();
      const updated = list.filter((h) => h.seriesSlug !== seriesSlug);
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cinestream_history_change', { detail: updated }));
      return updated;
    } catch (e) {
      console.error('Failed removing from history:', e);
      return storageService.getHistory();
    }
  },

  clearAllHistory(): void {
    try {
      localStorage.removeItem(KEYS.HISTORY);
      window.dispatchEvent(new CustomEvent('cinestream_history_change', { detail: [] }));
    } catch (e) {
      console.error('Failed clearing history:', e);
    }
  },

  // ==================== SEARCH HISTORY ====================
  getSearchHistory(): string[] {
    try {
      const data = localStorage.getItem(KEYS.SEARCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSearchQuery(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed) return storageService.getSearchHistory();
    try {
      const history = storageService.getSearchHistory().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...history].slice(0, 10);
      localStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  clearSearchHistory(): void {
    localStorage.removeItem(KEYS.SEARCH_HISTORY);
  },
};
