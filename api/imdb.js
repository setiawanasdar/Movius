import fs from 'fs';
import path from 'path';

// In-memory runtime cache
const cache = new Map();
let precomputedMap = null;

function getPrecomputed(cleanKey) {
  if (!precomputedMap) {
    try {
      const jsonPath = path.join(process.cwd(), 'api', 'imdbMetadata.json');
      if (fs.existsSync(jsonPath)) {
        precomputedMap = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } else {
        precomputedMap = {};
      }
    } catch {
      precomputedMap = {};
    }
  }
  return precomputedMap[cleanKey] || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { query, slug, year } = req.query;
  const rawTitle = String(query || slug || '').trim();

  if (!rawTitle) {
    return res.status(400).json({ success: false, error: 'Query or slug parameter is required' });
  }

  const cleanTitle = rawTitle
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^\//, '')
    .replace(/\s*\[.*?\]\s*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/-\s*\d{4}$/, '')
    .replace(/[-_]/g, ' ')
    .trim();

  const cacheKey = `${cleanTitle.toLowerCase()}_${year || ''}`;
  if (cache.has(cacheKey)) {
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).json({ success: true, results: cache.get(cacheKey) });
  }

  // Check precomputed database by slug and title
  const slugKey = String(slug || rawTitle).replace(/^\//, '').trim();
  const pre = getPrecomputed(slugKey) || getPrecomputed(cleanTitle.toLowerCase().replace(/\s+/g, '-'));
  if (pre) {
    cache.set(cacheKey, pre);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).json({ success: true, results: pre });
  }

  try {
    const q = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const imdbRes = await fetch(`https://v3.sg.media-imdb.com/suggestion/x/${q}.json`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!imdbRes.ok) {
      return res.status(502).json({ success: false, error: 'Upstream IMDb error' });
    }

    const data = await imdbRes.json();
    if (!data.d || data.d.length === 0) {
      return res.status(404).json({ success: false, error: 'Title not found on IMDb' });
    }

    const targetYear = year ? parseInt(String(year), 10) : null;
    let best = null;

    if (targetYear) {
      best = data.d.find(
        (x) =>
          x.y === targetYear &&
          (x.qid === 'movie' || x.qid === 'tvSeries' || x.q === 'feature' || x.q === 'TV series')
      );
    }
    if (!best) {
      best = data.d.find(
        (x) => x.qid === 'movie' || x.qid === 'tvSeries' || x.q === 'feature' || x.q === 'TV series'
      );
    }
    if (!best) {
      best = data.d[0];
    }

    const imdbId = best.id;
    const imdbPoster = best.i?.imageUrl || null;
    const imdbYear = best.y || targetYear;
    const imdbCast = best.s ? best.s.split(',').map((s) => s.trim()) : [];
    const type = best.qid === 'tvSeries' || best.q === 'TV series' ? 'series' : 'movie';

    let imdbRating = null;
    let imdbSynopsis = null;
    let imdbBackdrop = null;
    let imdbGenres = null;
    let imdbDirector = null;

    // Fetch detailed metadata from Cinemeta
    try {
      const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`, {
        signal: AbortSignal.timeout(3500),
      });

      if (metaRes.ok) {
        const metaJson = await metaRes.json();
        const meta = metaJson?.meta;
        if (meta) {
          if (meta.imdbRating) {
            const parsed = parseFloat(meta.imdbRating);
            if (!isNaN(parsed) && parsed > 0) {
              imdbRating = parsed;
            }
          }
          if (meta.description) {
            imdbSynopsis = meta.description.trim();
          }
          if (meta.background) {
            imdbBackdrop = meta.background;
          }
          if (meta.genres) {
            imdbGenres = meta.genres;
          }
          if (meta.director && meta.director.length > 0) {
            imdbDirector = meta.director[0];
          }
        }
      }
    } catch {}

    const result = {
      imdbId,
      title: best.l || cleanTitle,
      year: imdbYear,
      rating: imdbRating,
      poster: imdbPoster,
      synopsis: imdbSynopsis,
      backdrop: imdbBackdrop,
      genres: imdbGenres,
      cast: imdbCast,
      director: imdbDirector,
    };

    cache.set(cacheKey, result);

    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).json({ success: true, results: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
