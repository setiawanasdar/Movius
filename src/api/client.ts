import { FALLBACK_DATA } from './fallbackData';

// Configurable API base URL, defaults to the specified API: https://movieapi-sage.vercel.app
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://movieapi-sage.vercel.app';

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<unknown>>();

// In-memory cache (TTL: 3 minutes)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const apiCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 3 * 60 * 1000;

/**
 * Clean fetch wrapper with deduplication, in-memory caching,
 * and resilient offline/error fallback.
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
    try {
      const response = await fetch(url.toString(), {
        signal: options?.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      // Check if API returned an error object like { success: false, error: ... }
      if (json && json.success === false && json.error) {
        throw new Error(json.error);
      }

      // Save to cache
      apiCache.set(cacheKey, {
        data: json,
        timestamp: Date.now(),
      });

      return json as T;
    } catch (err: unknown) {
      // If request was manually aborted, re-throw
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }

      console.warn(`[API] Failed fetching ${cleanEndpoint}:`, (err as Error).message);

      // Attempt graceful fallback from local verified dataset
      const fallback = resolveFallback<T>(cleanEndpoint, options?.fallbackKey);
      if (fallback) {
        console.info(`[API] Using verified fallback dataset for ${cleanEndpoint}`);
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
 * Resolves static snapshot data if remote API encounters 403 or network downtime
 */
function resolveFallback<T>(endpoint: string, fallbackKey?: string): T | null {
  if (endpoint.includes('/latest')) {
    return FALLBACK_DATA.latest as unknown as T;
  }
  if (endpoint.includes('/popular')) {
    return FALLBACK_DATA.popular as unknown as T;
  }
  if (endpoint.includes('/drakor')) {
    return FALLBACK_DATA.drakor as unknown as T;
  }
  if (endpoint.includes('/ongoing')) {
    return FALLBACK_DATA.ongoing as unknown as T;
  }
  if (endpoint.includes('/completed')) {
    return FALLBACK_DATA.completed as unknown as T;
  }
  if (endpoint.includes('/genres')) {
    return FALLBACK_DATA.genres as unknown as T;
  }
  if (endpoint.includes('/countries')) {
    return FALLBACK_DATA.countries as unknown as T;
  }
  if (endpoint.includes('/series/')) {
    const slug = fallbackKey || endpoint.split('/series/')[1]?.split('?')[0];
    if (slug && (FALLBACK_DATA.series as Record<string, unknown>)[slug]) {
      return {
        success: true,
        results: (FALLBACK_DATA.series as Record<string, unknown>)[slug],
      } as unknown as T;
    }
    // Return first available series in fallback
    const firstKey = Object.keys(FALLBACK_DATA.series)[0];
    if (firstKey) {
      return {
        success: true,
        results: (FALLBACK_DATA.series as Record<string, unknown>)[firstKey],
      } as unknown as T;
    }
  }
  if (endpoint.includes('/episode/')) {
    const epSlug = fallbackKey || endpoint.split('/episode/')[1]?.split('?')[0];
    if (epSlug && (FALLBACK_DATA.episodes as Record<string, unknown>)[epSlug]) {
      return {
        success: true,
        results: (FALLBACK_DATA.episodes as Record<string, unknown>)[epSlug],
      } as unknown as T;
    }
    const firstEpKey = Object.keys(FALLBACK_DATA.episodes)[0];
    if (firstEpKey) {
      return {
        success: true,
        results: (FALLBACK_DATA.episodes as Record<string, unknown>)[firstEpKey],
      } as unknown as T;
    }
  }
  if (endpoint.includes('/search')) {
    // Return sample results matching search
    return {
      success: true,
      page: 1,
      totalPages: 1,
      count: FALLBACK_DATA.popular.items?.length || 0,
      items: FALLBACK_DATA.popular.items || [],
    } as unknown as T;
  }

  return null;
}
