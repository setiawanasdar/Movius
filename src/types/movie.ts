export interface CatalogItem {
  title: string;
  slug: string;
  poster: string;
  rating: number | null;
  year: number | null;
  season?: number | null;
  episode?: number | null;
  isComplete?: boolean;
  isSeries?: boolean;
  isMovie?: boolean;
  genres: string[];
  url?: string;
  source?: string;
  type?: 'series' | 'movie' | 'drakor';
  imdbId?: string;
  imdbRating?: number | string | null;
  synopsis?: string;
  backdrop?: string;
  director?: string;
  cast?: string[];
  country?: string;
}

export interface CatalogResponse {
  success: boolean;
  page: number;
  totalPages: number;
  count: number;
  items: CatalogItem[];
  cached?: boolean;
}

export interface EpisodeItem {
  season?: number;
  episodeNumber?: number;
  title: string;
  slug: string;
  url?: string;
}

export interface SeasonGroup {
  season: number;
  totalEpisodes: number;
  episodes: EpisodeItem[];
}

export interface SeriesDetail {
  title: string;
  fullTitle: string;
  slug: string;
  poster: string;
  rating: number | null;
  year: number | null;
  isMovie?: boolean;
  synopsis: string;
  backdrop?: string;
  imdbId?: string;
  imdbRating?: number | string | null;
  metadata: {
    director?: string;
    cast?: string[];
    genres: string[];
    country?: string;
    totalSeasons: number;
    totalEpisodes: number;
    status: string;
  };
  seasons: SeasonGroup[];
  url?: string;
}

export interface StreamServer {
  server: string;
  url: string;
  isActive: boolean;
}

export interface EpisodeStream {
  title: string;
  fullTitle?: string;
  slug: string;
  episode: number;
  season: number;
  isMovie?: boolean;
  series: {
    title: string;
    slug: string;
    poster: string;
    rating: number | null;
    year: number | null;
    isMovie?: boolean;
    url?: string;
    imdbId?: string;
    imdbRating?: number | string | null;
  };
  streaming: {
    defaultStreamUrl: string;
    servers: StreamServer[];
  };
  navigation: {
    previous: { slug: string; url?: string } | null;
    next: { slug: string; url?: string } | null;
  };
}

export interface GenreItem {
  slug: string;
  name: string;
}

export interface CountryItem {
  slug: string;
  name: string;
}

export interface WatchHistoryItem {
  id: string; // e.g. seriesSlug or seriesSlug-episodeSlug
  seriesSlug: string;
  episodeSlug: string;
  seriesTitle: string;
  episodeTitle: string;
  poster: string;
  season: number;
  episodeNumber: number;
  currentTime: number; // in seconds
  duration: number; // in seconds
  percentage: number;
  updatedAt: number;
}

export interface WatchlistItem {
  slug: string;
  title: string;
  poster: string;
  rating: number | null;
  year: number | null;
  genres: string[];
  status: string;
  totalEpisodes?: number;
  addedAt: number;
}

export type CatalogCategory =
  | 'popular'
  | 'latest'
  | 'drakor'
  | 'ongoing'
  | 'completed'
  | 'asian'
  | 'west';
