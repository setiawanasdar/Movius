import { FALLBACK_DATA } from './fallbackData';
import imdbMetadata from '../../api/imdbMetadata.json';
import type { CatalogItem, SeriesDetail, EpisodeStream } from '../types/movie';

// Configurable API base URL, defaults to: https://movieapi-sage.vercel.app
const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://movieapi-sage.vercel.app';

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<unknown>>();

// In-memory cache (TTL: 3 minutes)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const apiCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 3 * 60 * 1000;

function toTitleCase(str: string): string {
  return str
    .replace(/-\d{4}$/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Build comprehensive unified catalog map for robust offline/fallback lookup
const allCatalogItemsMap = new Map<string, CatalogItem>();
const seenUniqueSlugs = new Set<string>();
const allCatalogItems: CatalogItem[] = [];

[
  ...(FALLBACK_DATA.popular?.items || []),
  ...(FALLBACK_DATA.latest?.items || []),
  ...(FALLBACK_DATA.drakor?.items || []),
  ...(FALLBACK_DATA.ongoing?.items || []),
  ...(FALLBACK_DATA.completed?.items || []),
  ...(FALLBACK_DATA.asian?.items || []),
  ...(FALLBACK_DATA.west?.items || []),
].forEach((item) => {
  if (item && item.slug) {
    const raw = String(item.slug);
    const clean = raw.replace(/^\//, '');
    allCatalogItemsMap.set(raw, item as CatalogItem);
    allCatalogItemsMap.set(clean, item as CatalogItem);
    if (!seenUniqueSlugs.has(clean)) {
      seenUniqueSlugs.add(clean);
      allCatalogItems.push(item as CatalogItem);
    }
  }
});

/**
 * Universal enricher that upgrades raw or scraped items with authentic IMDb data
 * and eliminates LK21 placeholder ratings (10 or >= 9.8).
 */
export function enrichCatalogItem(item: CatalogItem): CatalogItem {
  if (!item) return item;
  const rawSlug = String(item.slug || '');
  const cleanSlug = rawSlug.replace(/^\//, '').trim();
  const slugKey = cleanSlug.toLowerCase();
  const titleKey = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-');

  const meta =
    (imdbMetadata as Record<string, any>)[cleanSlug] ||
    (imdbMetadata as Record<string, any>)[rawSlug] ||
    (imdbMetadata as Record<string, any>)[slugKey] ||
    (imdbMetadata as Record<string, any>)[titleKey];

  const rawRating = Number(item.rating);
  const cleanItemRating = rawRating > 0 && rawRating < 9.8 ? rawRating : null;

  if (meta) {
    const metaRating = Number(meta.rating || meta.imdbRating);
    const validRating = metaRating > 0 && metaRating < 9.8 ? metaRating : cleanItemRating;

    return {
      ...item,
      title: meta.title || item.title,
      poster:
        meta.poster && meta.poster.includes('amazon.com')
          ? meta.poster
          : item.poster || meta.poster,
      backdrop: meta.backdrop || item.backdrop || undefined,
      rating: validRating,
      imdbRating: validRating,
      imdbId: meta.imdbId || item.imdbId || undefined,
      synopsis: meta.synopsis || item.synopsis || undefined,
      director: meta.director || item.director || undefined,
      cast: meta.cast?.length ? meta.cast : item.cast || undefined,
      genres: meta.genres?.length ? meta.genres : item.genres,
    };
  }

  return {
    ...item,
    rating: cleanItemRating,
    imdbRating: null,
  };
}

/**
 * Universal enricher for full series details to remove any mock placeholders
 */
export function enrichSeriesDetail(detail: SeriesDetail): SeriesDetail {
  if (!detail) return detail;
  const rawSlug = String(detail.slug || '');
  const cleanSlug = rawSlug.replace(/^\//, '').trim();
  const titleKey = (detail.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-');

  const meta =
    (imdbMetadata as Record<string, any>)[cleanSlug] ||
    (imdbMetadata as Record<string, any>)[rawSlug] ||
    (imdbMetadata as Record<string, any>)[titleKey];

  const metaRating = Number(meta?.rating || meta?.imdbRating);
  const rawRating = Number(detail.rating);
  const validRating =
    metaRating > 0 && metaRating < 9.8
      ? metaRating
      : rawRating > 0 && rawRating < 9.8
      ? rawRating
      : null;

  const rawDirector = meta?.director || detail.metadata?.director;
  const validDirector =
    rawDirector && !['sutradara pilihan', 'sutradara', 'pilihan', 'unknown', '-'].includes(rawDirector.toLowerCase())
      ? rawDirector
      : undefined;

  const rawCast = meta?.cast?.length ? meta.cast : detail.metadata?.cast || [];
  const validCast = (rawCast as string[]).filter(
    (c: string) => !['pemeran utama', 'bintang film', 'bintang tamu', 'unknown'].includes(c.toLowerCase())
  );

  const isDrakor =
    detail.metadata?.genres?.some((g) => ['drakor', 'drama korea'].includes(g.toLowerCase())) ||
    cleanSlug.includes('drakor');

  const rawCountry = meta?.country || detail.metadata?.country;
  const validCountry = isDrakor
    ? 'Korea Selatan'
    : rawCountry && !['korea selatan'].includes(rawCountry.toLowerCase())
    ? rawCountry
    : undefined;

  const validSynopsis =
    meta?.synopsis ||
    (detail.synopsis && !detail.synopsis.includes('menyajikan tayangan sinematik lengkap')
      ? detail.synopsis
      : 'Sinopsis resmi belum tersedia untuk judul ini. Tayangan ini dapat langsung Anda tonton secara penuh beresolusi Full HD dengan subtitle Bahasa Indonesia.');

  const validPoster =
    meta?.poster && meta.poster.includes('amazon.com')
      ? meta.poster
      : detail.poster || meta?.poster || '';

  return {
    ...detail,
    title: meta?.title || detail.title,
    poster: validPoster,
    backdrop: meta?.backdrop || detail.backdrop || validPoster,
    rating: validRating,
    imdbRating: validRating,
    imdbId: meta?.imdbId || detail.imdbId || undefined,
    synopsis: validSynopsis,
    metadata: {
      ...detail.metadata,
      director: validDirector,
      cast: validCast.length > 0 ? validCast : undefined,
      country: validCountry,
      genres: meta?.genres?.length ? meta.genres : detail.metadata?.genres,
    },
  };
}

/**
 * Clean fetch wrapper with deduplication, in-memory caching,
 * fast 3.5s timeout, and comprehensive resilient fallback.
 */
export async function apiClient<T>(
  endpoint: string,
  options?: {
    params?: Record<string, string | number | undefined>;
    signal?: AbortSignal;
    skipCache?: boolean;
    fallbackKey?: string;
  }
): Promise<T> {
  // Construct clean URL with search params
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${BASE_URL}${cleanEndpoint}`);

  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.append(k, String(v));
      }
    });
  }

  const cacheKey = url.toString();

  // Check in-memory cache
  if (!options?.skipCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  // Deduplicate in-flight requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const fetchPromise = (async () => {
    // 3.5-second timeout controller so UI never hangs
    const timeoutController = new AbortController();
    const timeoutTimer = setTimeout(() => {
      timeoutController.abort();
    }, 3500);

    // Merge consumer signal with timeout
    if (options?.signal) {
      options.signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
    }

    try {
      const response = await fetch(url.toString(), {
        signal: timeoutController.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      // Check if API returned an error object like { success: false, error: ... }
      if (json && json.success === false && json.error) {
        throw new Error(json.error);
      }

      // Normalize episode payload between parentSeries and series
      if (cleanEndpoint.includes('/episode/') && json && json.results) {
        const r = json.results as Record<string, unknown>;
        if (!r.series && r.parentSeries) {
          r.series = r.parentSeries;
        }
        if (!r.slug && r.episodeSlug) {
          r.slug = r.episodeSlug;
        }
        if (r.navigation && typeof r.navigation === 'object') {
          const nav = r.navigation as Record<string, unknown>;
          if (!nav.previous && nav.prevEpisode) {
            nav.previous = nav.prevEpisode;
          }
          if (!nav.next && nav.nextEpisode) {
            nav.next = nav.nextEpisode;
          }
        }
      }

      // Automatically enrich all items and results with authentic IMDb metadata
      if (json && typeof json === 'object') {
        const obj = json as Record<string, unknown>;
        if (Array.isArray(obj.items)) {
          obj.items = (obj.items as CatalogItem[]).map(enrichCatalogItem);
        } else if (Array.isArray(obj.results)) {
          obj.results = (obj.results as CatalogItem[]).map(enrichCatalogItem);
        } else if (
          obj.results &&
          typeof obj.results === 'object' &&
          cleanEndpoint.includes('/series/')
        ) {
          obj.results = enrichSeriesDetail(obj.results as SeriesDetail);
        }
      }

      // Save to cache
      apiCache.set(cacheKey, {
        data: json,
        timestamp: Date.now(),
      });

      return json as T;
    } catch (err: unknown) {
      clearTimeout(timeoutTimer);

      // If consumer manually aborted (not timeout), re-throw
      if (
        err instanceof DOMException &&
        err.name === 'AbortError' &&
        options?.signal?.aborted
      ) {
        throw err;
      }

      console.warn(`[API] Remote call for ${cleanEndpoint} failed or timed out. Falling back to local data.`);

      // Attempt graceful fallback from local verified dataset
      const fallback = resolveFallback<T>(cleanEndpoint, options?.params, options?.fallbackKey);
      if (fallback) {
        return fallback;
      }

      throw err;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Helper to paginate and deduplicate catalog items cleanly
 */
function paginateCatalogList<T>(items: CatalogItem[], page: string | number = 1, perPage = 24): T {
  const parsedPage = Math.max(1, typeof page === 'number' ? page : parseInt(String(page), 10) || 1);
  const seen = new Set<string>();
  const uniqueItems = items.filter((item) => {
    if (!item?.slug || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(uniqueItems.length / perPage));
  const currentPage = Math.min(parsedPage, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paged = uniqueItems.slice(startIndex, startIndex + perPage);

  return {
    success: true,
    page: currentPage,
    totalPages,
    count: paged.length,
    totalCount: uniqueItems.length,
    items: paged,
  } as unknown as T;
}

/**
 * Resolves comprehensive static snapshot data when remote API encounters
 * Cloudflare 403 blocks, downtime, or network latency.
 */
function resolveFallback<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  fallbackKey?: string
): T | null {
  const page = params?.page ? parseInt(String(params.page), 10) : 1;

  // 1. Rilis Terbaru
  if (endpoint.includes('/latest')) {
    return paginateCatalogList<T>(FALLBACK_DATA.latest.items as CatalogItem[], page);
  }

  // 2. Populer / Top
  if (endpoint.includes('/popular')) {
    return paginateCatalogList<T>(FALLBACK_DATA.popular.items as CatalogItem[], page);
  }

  // 3. Drama Korea
  if (endpoint.includes('/drakor')) {
    return paginateCatalogList<T>(FALLBACK_DATA.drakor.items as CatalogItem[], page);
  }

  // 4. Ongoing Series
  if (endpoint.includes('/ongoing')) {
    return paginateCatalogList<T>(FALLBACK_DATA.ongoing.items as CatalogItem[], page);
  }

  // 5. Completed / Tamat
  if (endpoint.includes('/completed')) {
    return paginateCatalogList<T>(FALLBACK_DATA.completed.items as CatalogItem[], page);
  }

  // 6. Asian Series
  if (endpoint.includes('/asian')) {
    return paginateCatalogList<T>(FALLBACK_DATA.asian.items as CatalogItem[], page);
  }

  // 7. Western Series
  if (endpoint.includes('/west')) {
    return paginateCatalogList<T>(FALLBACK_DATA.west.items as CatalogItem[], page);
  }

  // 8. Filter Genre
  if (endpoint.includes('/genre/')) {
    const genreSlug = decodeURIComponent(endpoint.split('/genre/')[1]?.split('?')[0] || '').toLowerCase();
    const matched = allCatalogItems.filter((item) =>
      item.genres?.some((g) => g.toLowerCase().includes(genreSlug))
    );
    const list = matched.length > 0 ? matched : allCatalogItems;
    return paginateCatalogList<T>(list, page);
  }

  // 9. Filter Negara
  if (endpoint.includes('/country/')) {
    const countrySlug = decodeURIComponent(endpoint.split('/country/')[1]?.split('?')[0] || '').toLowerCase();
    let matched: CatalogItem[] = [];
    if (countrySlug.includes('korea')) {
      matched = (FALLBACK_DATA.drakor.items as CatalogItem[]) || [];
    } else if (countrySlug.includes('usa') || countrySlug.includes('uk') || countrySlug.includes('united-states')) {
      matched = (FALLBACK_DATA.west.items as CatalogItem[]) || [];
    } else {
      matched = allCatalogItems.filter((i) => i.genres.includes('Drama'));
    }
    const list = matched.length > 0 ? matched : allCatalogItems;
    return paginateCatalogList<T>(list, page);
  }

  // 10. Filter Tahun
  if (endpoint.includes('/year/')) {
    const yearStr = endpoint.split('/year/')[1]?.split('?')[0] || '2026';
    const yearNum = parseInt(yearStr, 10);
    const matched = allCatalogItems.filter((item) => item.year === yearNum);
    const list = matched.length > 0 ? matched : allCatalogItems;
    return paginateCatalogList<T>(list, page);
  }

  // 11. Genres & Countries metadata
  if (endpoint.includes('/genres')) {
    return FALLBACK_DATA.genres as unknown as T;
  }
  if (endpoint.includes('/countries')) {
    return FALLBACK_DATA.countries as unknown as T;
  }

  // 12. Pencarian (Search)
  if (endpoint.includes('/search')) {
    let kw = (params?.keyword as string) || '';
    if (!kw && endpoint.includes('keyword=')) {
      kw = decodeURIComponent(endpoint.split('keyword=')[1]?.split('&')[0] || '');
    }
    const cleanKw = kw.trim().toLowerCase();

    const matched = cleanKw
      ? allCatalogItems.filter(
          (i) =>
            i.title.toLowerCase().includes(cleanKw) ||
            i.slug.toLowerCase().includes(cleanKw) ||
            i.genres.some((g) => g.toLowerCase().includes(cleanKw))
        )
      : allCatalogItems;

    return paginateCatalogList<T>(matched, page);
  }

  // 13. Detail Series
  if (endpoint.includes('/series/')) {
    const slug = fallbackKey || endpoint.split('/series/')[1]?.split('?')[0];
    if (slug) {
      // Direct cached series match
      if ((FALLBACK_DATA.series as Record<string, unknown>)[slug]) {
        return {
          success: true,
          results: (FALLBACK_DATA.series as Record<string, unknown>)[slug],
        } as unknown as T;
      }

      // Find in catalog items or imdbMetadata to build dynamic, accurate SeriesDetail
      const cleanSlug = String(slug || '').replace(/^\//, '');
      const meta =
        (imdbMetadata as Record<string, any>)[cleanSlug] ||
        (imdbMetadata as Record<string, any>)[slug] ||
        (imdbMetadata as Record<string, any>)[cleanSlug.toLowerCase()];

      const catalogItem = allCatalogItemsMap.get(slug) || allCatalogItemsMap.get(cleanSlug) || allCatalogItemsMap.get(`/${cleanSlug}`);
      const title = meta?.title || (catalogItem ? catalogItem.title : toTitleCase(slug));
      const year = meta?.year || catalogItem?.year || 2026;

      // Determine if this item is genuinely a series or a single full movie
      const isSeries = Boolean(
        catalogItem?.isSeries === true ||
        (typeof catalogItem?.episode === 'number' && catalogItem.episode > 1) ||
        (typeof catalogItem?.season === 'number' && catalogItem.season > 1) ||
        catalogItem?.genres?.some((g) =>
          ['drakor', 'drama korea', 'series', 'serial', 'tv series'].includes(g.toLowerCase())
        ) ||
        slug.includes('-season-') ||
        slug.includes('-episode-')
      );

      const rawRating = Number(meta?.rating || meta?.imdbRating || catalogItem?.rating);
      const cleanRating = rawRating > 0 && rawRating < 9.8 ? rawRating : null;

      const validDirector = meta?.director || catalogItem?.director || undefined;
      const validCast = meta?.cast?.length ? meta.cast : catalogItem?.cast?.length ? catalogItem.cast : undefined;
      const isDrakor =
        catalogItem?.genres?.some((g) => ['drakor', 'drama korea'].includes(g.toLowerCase())) ||
        cleanSlug.includes('drakor');
      const validCountry = isDrakor ? 'Korea Selatan' : meta?.country || catalogItem?.country || undefined;

      const validPoster =
        meta?.poster && meta.poster.includes('amazon.com')
          ? meta.poster
          : catalogItem?.poster || meta?.poster || '';
      const validBackdrop = meta?.backdrop || catalogItem?.backdrop || validPoster;

      const validSynopsis =
        meta?.synopsis ||
        catalogItem?.synopsis ||
        'Sinopsis resmi belum tersedia untuk judul ini. Tayangan ini dapat langsung Anda tonton secara penuh beresolusi Full HD dengan subtitle Bahasa Indonesia.';

      const validGenres = meta?.genres?.length
        ? meta.genres
        : catalogItem?.genres?.length
        ? catalogItem.genres
        : isSeries
        ? ['Drama']
        : ['Movie'];

      if (!isSeries) {
        // Pure standalone Movie (Film Bioskop / Full Movie)
        const dynamicMovie: SeriesDetail = {
          title,
          fullTitle: `${title} (${year})`,
          slug,
          isMovie: true,
          poster: validPoster,
          backdrop: validBackdrop,
          rating: cleanRating,
          imdbId: meta?.imdbId || catalogItem?.imdbId,
          imdbRating: cleanRating,
          year,
          synopsis: validSynopsis,
          metadata: {
            director: validDirector,
            cast: validCast,
            genres: validGenres,
            country: validCountry,
            totalSeasons: 1,
            totalEpisodes: 1,
            status: 'Full Movie',
          },
          seasons: [
            {
              season: 1,
              totalEpisodes: 1,
              episodes: [
                {
                  season: 1,
                  episodeNumber: 1,
                  title: `${title} (Full Movie)`,
                  slug,
                  url: catalogItem?.url || `https://tv12.lk21official.cc/${slug}`,
                },
              ],
            },
          ],
          url: catalogItem?.url || `https://tv12.lk21official.cc/${slug}`,
        };

        return {
          success: true,
          results: dynamicMovie,
        } as unknown as T;
      }

      // Genuine TV Series with multiple episodes
      const totalEpisodes = catalogItem?.episode && typeof catalogItem.episode === 'number' ? catalogItem.episode : 12;

      const dynamicSeries: SeriesDetail = {
        title,
        fullTitle: `${title} (${year})`,
        slug,
        isMovie: false,
        poster: validPoster,
        backdrop: validBackdrop,
        rating: cleanRating,
        imdbId: meta?.imdbId || catalogItem?.imdbId,
        imdbRating: cleanRating,
        year,
        synopsis: validSynopsis,
        metadata: {
          director: validDirector,
          cast: validCast,
          genres: validGenres,
          country: validCountry,
          totalSeasons: 1,
          totalEpisodes,
          status: catalogItem?.isComplete ? 'Completed' : 'Ongoing',
        },
        seasons: [
          {
            season: 1,
            totalEpisodes,
            episodes: Array.from({ length: totalEpisodes }, (_, i) => ({
              season: 1,
              episodeNumber: i + 1,
              title: `${title} Episode ${i + 1}`,
              slug: `${slug}-season-1-episode-${i + 1}-2026`,
              url: `https://tv.nontondrama.vip/${slug}-season-1-episode-${i + 1}-2026`,
            })),
          },
        ],
        url: `https://tv.nontondrama.vip/${slug}`,
      };

      return {
        success: true,
        results: dynamicSeries,
      } as unknown as T;
    }
  }

  // 14. Nonton Episode & Stream
  if (endpoint.includes('/episode/')) {
    const epSlug = fallbackKey || endpoint.split('/episode/')[1]?.split('?')[0];
    if (epSlug) {
      // Direct cached episode match
      if ((FALLBACK_DATA.episodes as Record<string, unknown>)[epSlug]) {
        return {
          success: true,
          results: (FALLBACK_DATA.episodes as Record<string, unknown>)[epSlug],
        } as unknown as T;
      }

      // Parse episode number and series slug
      const epMatch = epSlug.match(/-season-(\d+)-episode-(\d+)/i) || epSlug.match(/episode-(\d+)/i);
      const currentSeason = epMatch && epMatch[2] ? parseInt(epMatch[1], 10) : 1;
      const currentEp = epMatch && epMatch[2] ? parseInt(epMatch[2], 10) : (epMatch ? parseInt(epMatch[1], 10) : 1);
      const seriesSlugClean = epSlug.replace(/-season-\d+-episode-\d+.*$/, '');
      const catalogItem = allCatalogItemsMap.get(seriesSlugClean) || allCatalogItemsMap.get(epSlug.replace(/-season-\d+-episode-\d+.*$/, '')) || allCatalogItemsMap.get(epSlug);
      const seriesTitle = catalogItem ? catalogItem.title : toTitleCase(seriesSlugClean);

      const baseSlug = seriesSlugClean.replace(/-\d{4}$/, '');

      const isMovie = Boolean(
        !epMatch &&
        (catalogItem?.isSeries === false ||
         (!catalogItem?.episode && !catalogItem?.season) ||
         catalogItem?.source === 'tv12.lk21official.cc' ||
         catalogItem?.url?.includes('lk21'))
      );

      const seriesInfo = {
        title: seriesTitle,
        slug: seriesSlugClean,
        poster: catalogItem?.poster || '',
        rating: catalogItem?.rating || 8.4,
        year: catalogItem?.year || 2026,
        isMovie,
        url: catalogItem?.url || `https://tv12.lk21official.cc/${seriesSlugClean}`,
      };

      const nav = isMovie
        ? { previous: null, next: null }
        : {
            previous: currentEp > 1 ? { slug: `${baseSlug}-season-1-episode-${currentEp - 1}-2026` } : null,
            next: { slug: `${baseSlug}-season-1-episode-${currentEp + 1}-2026` },
          };

      const dynamicEpisode: EpisodeStream = {
        title: isMovie ? `${seriesTitle} (Full Movie)` : `${seriesTitle} Episode ${currentEp}`,
        fullTitle: isMovie ? `${seriesTitle} (${catalogItem?.year || 2026}) Full Movie` : `${seriesTitle} Season ${currentSeason} Episode ${currentEp}`,
        slug: epSlug,
        episode: currentEp,
        season: currentSeason,
        isMovie,
        series: seriesInfo,
        streaming: {
          defaultStreamUrl: `/api/embed?episode=${encodeURIComponent(epSlug)}&server=p2p`,
          servers: [
            {
              server: 'Server 1: HLS VIP (PlayCDN Ultra HD)',
              url: `/api/embed?episode=${encodeURIComponent(epSlug)}&server=p2p`,
              isActive: true,
            },
            {
              server: 'Server 2: HLS Cadangan (Server Cepat)',
              url: `/api/embed?episode=${encodeURIComponent(epSlug)}&server=backup`,
              isActive: false,
            },
            {
              server: 'Server 3: HD Mirror (Stream Stabil)',
              url: `/api/embed?episode=${encodeURIComponent(epSlug)}&server=mirror`,
              isActive: false,
            },
            {
              server: 'Server 4: Direct HD Stream (Server Ringan)',
              url: `/api/embed?episode=${encodeURIComponent(epSlug)}&server=direct`,
              isActive: false,
            },
          ],
        },
        navigation: nav,
      };

      return {
        success: true,
        results: dynamicEpisode,
      } as unknown as T;
    }
  }

  return null;
}
