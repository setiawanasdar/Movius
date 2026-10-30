import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import type { WatchHistoryItem } from '../types/movie';
import { toast } from './useToastStore';

export function useHistoryStore() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => storageService.getHistory());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<WatchHistoryItem[]>;
      setHistory(customEvent.detail || storageService.getHistory());
    };

    window.addEventListener('cinestream_history_change', handleUpdate);
    return () => {
      window.removeEventListener('cinestream_history_change', handleUpdate);
    };
  }, []);

  const saveProgress = useCallback(
    (item: Omit<WatchHistoryItem, 'id' | 'updatedAt' | 'percentage'>) => {
      const saved = storageService.saveHistory(item);
      setHistory(storageService.getHistory());
      return saved;
    },
    []
  );

  const removeFromHistory = useCallback((seriesSlug: string, title?: string) => {
    const updated = storageService.removeFromHistory(seriesSlug);
    setHistory(updated);
    toast.info(`"${title || 'Riwayat'}" dihapus dari riwayat tontonan`);
  }, []);

  const clearHistory = useCallback(() => {
    storageService.clearAllHistory();
    setHistory([]);
    toast.info('Seluruh riwayat tontonan telah dibersihkan');
  }, []);

  const getProgressForSeries = useCallback(
    (seriesSlug: string): WatchHistoryItem | undefined => {
      return history.find((h) => h.seriesSlug === seriesSlug);
    },
    [history]
  );

  return {
    history,
    saveProgress,
    removeFromHistory,
    clearHistory,
    getProgressForSeries,
  };
}
