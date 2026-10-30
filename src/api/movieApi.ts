import { apiClient } from './client';
import type {
  CatalogResponse,
  SeriesDetail,
  EpisodeStream,
  GenreItem,
  CountryItem,
  CatalogCategory,
} from '../types/movie';

interface ApiDetailResponse<T> {
  success: boolean;
  results: T;
  cached?: boolean;
}

interface ApiListResponse<T> {
  success: boolean;
  count: number;
  results: T[];
  cached?: boolean;
}

export const movieApi = {
  /**
   * Fetch rilis serial & film terbaru
   */
  getLatest: (page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/latest', { params: { page }, signal }),

  /**
   * Fetch serial & film terpopuler / top hari ini
   */
  getPopular: (page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/popular', { params: { page }, signal }),

  /**
   * Fetch maraton Drama Korea (Drakor) sub Indo
   */
  getDrakor: (page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/drakor', { params: { page }, signal }),

  /**
   * Fetch serial yang masih berstatus Ongoing
   */
  getOngoing: (page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/ongoing', { params: { page }, signal }),

  /**
   * Fetch serial yang sudah Komplit / Tamat
   */
  getCompleted: (page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/completed', { params: { page }, signal }),

  /**
   * Fetch serial Asia
   */
  getAsian: (page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/asian', { params: { page }, signal }),

  /**
   * Fetch serial Western
   */
  getWestern: (page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/west', { params: { page }, signal }),

  /**
   * Generic category fetcher
   */
  getByCategory: (category: CatalogCategory, page: number = 1, signal?: AbortSignal) => {
    switch (category) {
      case 'popular':
        return movieApi.getPopular(page, signal);
      case 'latest':
        return movieApi.getLatest(page, signal);
      case 'drakor':
        return movieApi.getDrakor(page, signal);
      case 'ongoing':
        return movieApi.getOngoing(page, signal);
      case 'completed':
        return movieApi.getCompleted(page, signal);
      case 'asian':
        return movieApi.getAsian(page, signal);
      case 'west':
        return movieApi.getWestern(page, signal);
      default:
        return movieApi.getPopular(page, signal);
    }
  },

  /**
   * Filter berdasarkan genre
   */
  getByGenre: (genreSlug: string, page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>(`/api/genre/${encodeURIComponent(genreSlug)}`, {
      params: { page },
      signal,
    }),

  /**
   * Filter berdasarkan negara
   */
  getByCountry: (countrySlug: string, page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>(`/api/country/${encodeURIComponent(countrySlug)}`, {
      params: { page },
      signal,
    }),

  /**
   * Filter berdasarkan tahun rilis
   */
  getByYear: (year: string | number, page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>(`/api/year/${encodeURIComponent(year)}`, {
      params: { page },
      signal,
    }),

  /**
   * Pencarian judul film atau serial TV
   */
  search: (keyword: string, page: number = 1, signal?: AbortSignal) =>
    apiClient<CatalogResponse>('/api/search', {
      params: { keyword, page },
      signal,
    }),

  /**
   * Detail lengkap serial TV atau film
   */
  getSeriesDetail: async (slug: string, signal?: AbortSignal): Promise<SeriesDetail> => {
    const res = await apiClient<ApiDetailResponse<SeriesDetail>>(
      `/api/series/${encodeURIComponent(slug)}`,
      { signal, fallbackKey: slug }
    );
    return res.results;
  },

  /**
   * Detail streaming episode, multi-server embeds, dan link video
   */
  getEpisodeStream: async (episodeSlug: string, signal?: AbortSignal): Promise<EpisodeStream> => {
    const res = await apiClient<ApiDetailResponse<EpisodeStream>>(
      `/api/episode/${encodeURIComponent(episodeSlug)}`,
      { signal, fallbackKey: episodeSlug }
    );
    return res.results;
  },

  /**
   * Daftar metadata genre yang didukung
   */
  getGenres: async (signal?: AbortSignal): Promise<GenreItem[]> => {
    const res = await apiClient<ApiListResponse<GenreItem>>('/api/genres', { signal });
    return res.results || [];
  },

  /**
   * Daftar metadata negara yang didukung
   */
  getCountries: async (signal?: AbortSignal): Promise<CountryItem[]> => {
    const res = await apiClient<ApiListResponse<CountryItem>>('/api/countries', { signal });
    return res.results || [];
  },
};
