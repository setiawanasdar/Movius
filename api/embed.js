import { HARVESTED_HASHES } from './harvestedHashes.js';

// In-memory runtime cache for scraped episode URLs
const episodeCache = new Map();

// Combined verified high-speed known hashes (1,745+ verified items + presets)
const KNOWN_EPISODE_HASHES = {
  ...HARVESTED_HASHES,
  'doctor-x-age-white-mafia-season-1-episode-1-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/EHhKGEndUtY4WVJyiZnMaA',
    cast: 'https://videonode.de/iframe3/cast/Rnzl7s1xMaQ0Wn34cxgVoQ',
    hydrax: 'https://videonode.de/iframe3/hydrax/x0J1i3dYkK9V0zP5',
  },
  'lament-autumn-season-1-episode-1-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/Bi7sY0ZLPaLZCJ52ZoFuIA',
    cast: 'https://videonode.de/iframe3/cast/F0_k6Y4cwCqlNEXwFkxp1g',
  },
  'the-mentalist-season-1-episode-1-2008': {
    p2p: 'https://videonode.de/iframe3/p2p/zdhjJi7WBDsXyDpP3mCF6g',
    cast: 'https://videonode.de/iframe3/p2p/zdhjJi7WBDsXyDpP3mCF6g',
  },
  'queen-of-tears-season-1-episode-1-2024': {
    p2p: 'https://videonode.de/iframe3/p2p/N0j28tdsx9H6viuXvBWDMg',
    cast: 'https://videonode.de/iframe3/cast/9iS9H1wWEnRUbMyrMvVjbA',
    hydrax: 'https://videonode.de/iframe3/hydrax/pEqKAe4u-2xWD6PRgelbmA',
  },
  'shogun-season-1-episode-1-2024': {
    p2p: 'https://videonode.de/iframe3/p2p/017ovjz8vKszK8RObK6a2g',
    cast: 'https://videonode.de/iframe3/cast/tCKkU7qkRBB2sA9STkZO5g',
    hydrax: 'https://videonode.de/iframe3/hydrax/Gi6G8CZlWX9YhYlWij94FA',
  },
  'avatar-seven-havens-season-1-episode-1-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/lV7EXXPf_LGYWGakpzMQVA',
    cast: 'https://videonode.de/iframe3/cast/o4MVEsM7DbAAjqEC_wYpmw',
    hydrax: 'https://videonode.de/iframe3/hydrax/k99IQCf5mJh9w3o-rYAlkg',
  },
  'parasyte-the-grey-season-1-episode-1-2024': {
    p2p: 'https://videonode.de/iframe3/p2p/jDVNILiDhgSfxEU5Miqprg',
    cast: 'https://videonode.de/iframe3/cast/5Yte0-vHj7Ck7zHaxLajXw',
    hydrax: 'https://videonode.de/iframe3/hydrax/a8z7X97frctec04AE728xg',
  },
  'marry-my-husband-season-1-episode-1-2024': {
    p2p: 'https://videonode.de/iframe3/p2p/dv2osG0KgGnB2_x-DPP27g',
    cast: 'https://videonode.de/iframe3/cast/Y-KPhlGrxGdbiwHWdhOtRA',
    hydrax: 'https://videonode.de/iframe3/hydrax/0DVrk__Iu7LUGRMTb1dYUw',
  },
  'avatar-the-last-airbender-season-1-episode-1-2024': {
    p2p: 'https://videonode.de/iframe3/p2p/-mwH9GPbOGnWWmSF_10nrA',
    cast: 'https://videonode.de/iframe3/cast/s4d50rSdR6YQQJphDOo4jQ',
    hydrax: 'https://videonode.de/iframe3/hydrax/qFASUZASVatvbRsYuVepPQ',
  },
};

export default async function handler(req, res) {
  // CORS and framing headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *');
  res.setHeader('X-Frame-Options', 'ALLOWALL');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { action, url: queryUrl, episode, server = 'p2p' } = req.query;

  // 1. ACTION: M3U8 Playlist Proxy & Segment Rewriter
  if (action === 'm3u8') {
    if (!queryUrl) return res.status(400).send('Missing url parameter');
    const targetM3u8 = decodeURIComponent(queryUrl);

    try {
      const upstreamRes = await fetch(targetM3u8, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://playcdn.de/',
          'Origin': 'https://playcdn.de',
        },
      });

      if (!upstreamRes.ok) {
        return res.status(upstreamRes.status).send('Failed to fetch upstream playlist');
      }

      const m3u8Text = await upstreamRes.text();
      // Rewrite segment URLs to go through our proxy with action=segment or action=m3u8
      const rewritten = m3u8Text.replace(/^(https?:\/\/[^\r\n]+)/gm, (match) => {
        if (match.includes('.m3u8')) {
          return `/api/embed?action=m3u8&url=${encodeURIComponent(match)}`;
        }
        return `/api/embed?action=segment&url=${encodeURIComponent(match)}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(rewritten);
    } catch (err) {
      console.error('m3u8 proxy error:', err);
      return res.status(502).send('Error proxying m3u8 playlist');
    }
  }

  // 2. ACTION: Video Segment (MPEG-TS) Proxy with Edge Caching
  if (action === 'segment') {
    if (!queryUrl) return res.status(400).send('Missing url parameter');
    const targetSegment = decodeURIComponent(queryUrl);

    try {
      const segRes = await fetch(targetSegment, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://playcdn.de/',
          'Origin': 'https://playcdn.de',
        },
      });

      if (!segRes.ok) {
        return res.status(segRes.status).send('Failed to fetch upstream segment');
      }

      const arrayBuf = await segRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(buffer);
    } catch (err) {
      console.error('segment proxy error:', err);
      return res.status(502).send('Error proxying segment');
    }
  }

  // 3. ACTION: Resolve Stream and Render Player
  let targetUrl = queryUrl ? decodeURIComponent(queryUrl) : '';

  // If queryUrl contains a slug in /iframe3/:host/:id (e.g. /iframe3/p2p/deadly-tag-season-1-episode-1-2026)
  const initialVideonodeMatch = targetUrl.match(/\/iframe3\/([^/]+)\/([^/?]+)/);
  if (initialVideonodeMatch) {
    const rawHost = initialVideonodeMatch[1];
    const rawId = initialVideonodeMatch[2];
    if (rawId.includes('-') || rawId.length > 24) {
      const resolvedFromSlug = await resolveVideonodeUrlForEpisode(rawId, rawHost);
      if (resolvedFromSlug) {
        targetUrl = resolvedFromSlug;
      }
    }
  }

  // If episode slug was provided in query, dynamically resolve its actual videonode URL
  if (episode) {
    const cleanEpisode = decodeURIComponent(episode);
    const resolvedUrl = await resolveVideonodeUrlForEpisode(cleanEpisode, server);
    if (resolvedUrl) {
      targetUrl = resolvedUrl;
    }
  }

  // If targetUrl is an external iframe provider (e.g. multiembed.mov, vidsrc)
  if (targetUrl && !targetUrl.includes('videonode.de') && !targetUrl.includes('playcdn.de')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderIframeWrapper(targetUrl));
  }

  if (!targetUrl) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderFallbackPlayer(episode || 'Video Player', queryUrl));
  }

  try {
    const videonodeMatch = targetUrl.match(/\/iframe3\/([^/]+)\/([^/?]+)/);
    if (videonodeMatch) {
      let host = videonodeMatch[1];
      let id = videonodeMatch[2];

      // Second defensive check: If id is a slug, resolve it to hash
      if (id.includes('-') || id.length > 24) {
        const resolved = await resolveVideonodeUrlForEpisode(id, host);
        if (resolved) {
          const newMatch = resolved.match(/\/iframe3\/([^/]+)\/([^/?]+)/);
          if (newMatch) {
            host = newMatch[1];
            id = newMatch[2];
          }
        }
      }

      try {
        const apiRes = await fetch('https://videonode.de/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `https://videonode.de/iframe3/${host}/${id}`,
            'Origin': 'https://videonode.de',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          body: `host=${encodeURIComponent(host)}&id=${encodeURIComponent(id)}`,
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData && apiData.embedUrl) {
            // Case 1: playcdn.de embed -> verify slug -> get fileUrl -> render custom player with proxied m3u8
            if (apiData.embedUrl.includes('playcdn.de')) {
              const slug = apiData.embedUrl.replace(/^https?:\/\/[^/]+\//, '').split('?')[0];
              const verifyRes = await fetch(`https://playcdn.de/verify/${slug}`, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  'Referer': apiData.embedUrl,
                },
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData && verifyData.fileUrl) {
                  // Proxied m3u8 URL through our serverless endpoint
                  const proxiedM3u8Url = `/api/embed?action=m3u8&url=${encodeURIComponent(verifyData.fileUrl)}`;
                  res.setHeader('Content-Type', 'text/html; charset=utf-8');
                  return res.status(200).send(renderCustomPlayer(proxiedM3u8Url, verifyData.title, verifyData.poster));
                }
              }
            } else {
              // Case 2: Direct Embed provider without CSP restrictions (mfw09.org, abyssplayer.com, etc.)
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              return res.status(200).send(renderIframeWrapper(apiData.embedUrl));
            }
          }
        }
      } catch (innerErr) {
        console.warn('videonode api.php failed:', innerErr.message);
      }
    }

    // Direct embed or fallback
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderFallbackPlayer(episode || targetUrl, queryUrl));
  } catch (err) {
    console.error('Embed handler failed:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderFallbackPlayer(episode || targetUrl, queryUrl));
  }
}

/**
 * Resolves the genuine videonode streaming URL for any episode or movie
 */
async function resolveVideonodeUrlForEpisode(episodeSlug, server = 'p2p') {
  if (!episodeSlug) return null;
  const cleanEp = decodeURIComponent(episodeSlug);
  const cacheKey = `${cleanEp}_${server}`;
  if (episodeCache.has(cacheKey)) {
    return episodeCache.get(cacheKey);
  }

  // Generate candidate keys to search in verified hashes dictionary
  const cleanBase = cleanEp.replace(/-\d{4}$/, '');
  const epMatch = cleanEp.match(/-season-(\d+)-episode-(\d+)/i) || cleanEp.match(/episode-(\d+)/i);
  const currentEpNum = epMatch && epMatch[2] ? epMatch[2] : (epMatch ? epMatch[1] : '1');
  const seriesBase = cleanBase.replace(/-season-\d+-episode-\d+.*$/, '');
  const yearMatch = cleanEp.match(/\d{4}$/);
  const year = yearMatch ? yearMatch[0] : '2026';

  const candidates = [
    cleanEp,
    cleanBase,
    `${cleanBase}-season-1-episode-${currentEpNum}-${year}`,
    `${cleanBase}-season-1-episode-${currentEpNum}-2026`,
    `${cleanBase}-season-1-episode-${currentEpNum}-2025`,
    `${cleanBase}-season-1-episode-${currentEpNum}-2024`,
    `${cleanBase}-season-1-episode-${currentEpNum}`,
    `${seriesBase}-season-1-episode-${currentEpNum}-${year}`,
    `${seriesBase}-season-1-episode-${currentEpNum}-2026`,
    `${seriesBase}-season-1-episode-${currentEpNum}`,
    `${cleanBase}-episode-${currentEpNum}`,
    `${seriesBase}-${year}`,
    `${seriesBase}-2026`,
    seriesBase
  ];

  // 1. Fast dictionary lookup from 1,745+ verified hashes
  for (const cand of candidates) {
    if (KNOWN_EPISODE_HASHES[cand]?.[server]) {
      const url = KNOWN_EPISODE_HASHES[cand][server];
      episodeCache.set(cacheKey, url);
      return url;
    }
    // Also try p2p if requested server variant is missing
    if (KNOWN_EPISODE_HASHES[cand]?.p2p) {
      const url = KNOWN_EPISODE_HASHES[cand].p2p;
      episodeCache.set(cacheKey, url);
      return url;
    }
  }

  // 2. Upstream live scrape fallback
  const seen = new Set();
  for (const slug of candidates) {
    if (seen.has(slug)) continue;
    seen.add(slug);

    try {
      const res = await fetch(`https://tv.nontondrama.vip/${slug}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const regex = new RegExp(`data-url=["'](https:\\/\\/videonode\\.de\\/iframe3\\/${server}\\/[^"']+)["']`, 'i');
      const match = html.match(regex);
      if (match) {
        episodeCache.set(cacheKey, match[1]);
        return match[1];
      }

      const fallbackMatch = html.match(/data-url=["'](https:\/\/videonode\.de\/iframe3\/[^"']+)["']/i);
      if (fallbackMatch) {
        episodeCache.set(cacheKey, fallbackMatch[1]);
        return fallbackMatch[1];
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}

function renderCustomPlayer(proxiedM3u8Url, title = 'Video Player', poster = '') {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #video-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; outline: none; }
    .loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); color: #fff; z-index: 10; gap: 14px; transition: opacity 0.3s ease; }
    .spinner { width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.15); border-top-color: #e11d48; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; font-weight: 600; color: #e2e8f0; letter-spacing: 0.3px; }
    .sub-badge { font-size: 11px; color: #34d399; background: rgba(52, 211, 153, 0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(52, 211, 153, 0.3); }
    .status-badge { position: absolute; top: 12px; left: 12px; z-index: 5; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 11px; padding: 4px 10px; border-radius: 6px; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 6px; pointer-events: none; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
  </style>
</head>
<body>
  <div id="video-container">
    <div class="status-badge">
      <div class="status-dot"></div>
      <span>HLS VIP Sub Indo</span>
    </div>

    <video id="player" controls playsinline autoplay poster="${escapeHtml(poster)}"></video>

    <div id="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span class="loading-text">Memuat stream video...</span>
      <span class="sub-badge">Subtitle Indonesia Otomatis</span>
    </div>
  </div>

  <script>
    const video = document.getElementById('player');
    const loading = document.getElementById('loading');
    const hlsUrl = "${proxiedM3u8Url}";
    let isHidden = false;

    function hideLoading() {
      if (!isHidden && loading) {
        isHidden = true;
        loading.style.opacity = '0';
        setTimeout(() => { loading.style.display = 'none'; }, 300);
      }
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        hideLoading();
        video.play().catch(function() {
          // Autoplay was prevented by browser policy (user gesture required)
        });
      });

      hls.on(Hls.Events.ERROR, function(event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              hideLoading();
              break;
          }
        }
      });

      setTimeout(() => {
        if (!isHidden) {
          hls.startLoad();
        }
      }, 5000);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', function() {
        hideLoading();
        video.play().catch(function() {});
      });
    } else {
      hideLoading();
    }

    video.addEventListener('playing', hideLoading);
    video.addEventListener('canplay', hideLoading);
    video.addEventListener('loadeddata', hideLoading);
  </script>
</body>
</html>`;
}

function renderIframeWrapper(embedUrl) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Video Player</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe
    src="${escapeHtml(embedUrl)}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    allowfullscreen="true"
    webkitallowfullscreen="true"
    mozallowfullscreen="true"
  ></iframe>
</body>
</html>`;
}

function renderFallbackPlayer(targetTitle = '', rawUrl = '') {
  const cleanStr = String(targetTitle || rawUrl || 'Serial Film')
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/\/iframe3\/[^/]+\//, '');

  const epMatch = cleanStr.match(/-season-(\d+)-episode-(\d+)/i) || cleanStr.match(/episode-(\d+)/i);
  const season = epMatch && epMatch[2] ? epMatch[1] : '1';
  const episode = epMatch && epMatch[2] ? epMatch[2] : (epMatch ? epMatch[1] : '1');
  const seriesSlug = cleanStr
    .replace(/-season-\d+-episode-\d+.*$/, '')
    .replace(/-\d{4}$/, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .trim() || 'movie';

  const multiEmbedSrc = `https://multiembed.mov/?video_id=${encodeURIComponent(seriesSlug)}&s=${season}&e=${episode}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seriesSlug)} - Episode ${episode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #020617; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #wrapper { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; background: #000; }
    .badge-bar { position: absolute; top: 12px; left: 12px; z-index: 20; display: flex; align-items: center; gap: 8px; pointer-events: none; }
    .status-badge { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 8px; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
    iframe { width: 100%; height: 100%; border: none; flex: 1; display: block; }
  </style>
</head>
<body>
  <div id="wrapper">
    <div class="badge-bar">
      <div class="status-badge">
        <div class="dot"></div>
        <span>MultiEmbed HD (Server Cadangan Aktif)</span>
      </div>
    </div>
    <iframe
      src="${escapeHtml(multiEmbedSrc)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowfullscreen="true"
      webkitallowfullscreen="true"
      mozallowfullscreen="true"
    ></iframe>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
