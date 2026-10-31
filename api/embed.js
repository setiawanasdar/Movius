import { HARVESTED_HASHES } from './harvestedHashes.js';

// In-memory runtime cache for scraped episode URLs
const episodeCache = new Map();

// Helper to check if a hash is genuine 20-26 character videonode key
function isValidVideonodeHash(str) {
  if (!str || typeof str !== 'string') return false;
  const hash = str.split('/').pop().trim();
  return hash.length >= 20 && hash.length <= 26 && !hash.includes('-') && !hash.includes('/') && !hash.includes(' ');
}

// Extract clean hash from videonode URL or string
function extractHash(urlOrHash) {
  if (!urlOrHash || typeof urlOrHash !== 'string') return '';
  const match = urlOrHash.match(/\/iframe3\/[^/]+\/([a-zA-Z0-9_]{20,26})/i) || urlOrHash.match(/([a-zA-Z0-9_]{22})/);
  return match ? match[1] : '';
}

// Built-in verified high-speed seeds
const KNOWN_EPISODE_HASHES = {
  ...HARVESTED_HASHES,
  'doctor-x-age-white-mafia-season-1-episode-1-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/EHhKGEndUtY4WVJyiZnMaA',
  },
  'lament-autumn-season-1-episode-1-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/Bi7sY0ZLPaLZCJ52ZoFuIA',
  },
  'queen-of-tears-season-1-episode-1-2024': {
    p2p: 'https://videonode.de/iframe3/p2p/N0j28tdsx9H6viuXvBWDMg',
  },
  'shogun-season-1-episode-1-2024': {
    p2p: 'https://videonode.de/iframe3/p2p/017ovjz8vKszK8RObK6a2g',
  },
  'avatar-seven-havens-season-1-episode-1-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/lV7EXXPf_LGYWGakpzMQVA',
  },
  'spider-man-brand-new-day-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/10JeiG6WPgs0uv5ripdtKA',
  },
  'fragments-belonging-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/Bs-1HBdriD5lzCDAyHQx0w',
  },
  'hawk-season-1-episode-1-2026': {
    p2p: 'https://videonode.de/iframe3/p2p/-8gbl6OW9JuJH-xptrjIRA',
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
  let serverMode = String(server || 'p2p').toLowerCase();
  if (serverMode === 'cast') serverMode = 'backup';
  if (serverMode === 'multiembed') serverMode = 'mirror';
  if (serverMode === 'vidsrc') serverMode = 'direct';

  let targetUrl = queryUrl ? decodeURIComponent(queryUrl) : '';
  const cleanEpParam = episode ? decodeURIComponent(episode).trim() : '';

  // Extract hash directly if provided in queryUrl
  let activeHash = extractHash(targetUrl);

  // If no direct hash, resolve from episode slug
  if (!activeHash && cleanEpParam) {
    const resolvedUrl = await resolveVideonodeUrlForEpisode(cleanEpParam);
    if (resolvedUrl) {
      activeHash = extractHash(resolvedUrl);
      targetUrl = resolvedUrl;
    }
  }

  // If still no hash, attempt resolution with raw targetUrl
  if (!activeHash && targetUrl) {
    const slugFromUrl = targetUrl.replace(/^https?:\/\/[^/]+\//, '').replace(/\/iframe3\/[^/]+\//, '').split('?')[0];
    const resolvedUrl = await resolveVideonodeUrlForEpisode(slugFromUrl);
    if (resolvedUrl) {
      activeHash = extractHash(resolvedUrl);
      targetUrl = resolvedUrl;
    }
  }

  // If we have a genuine active videonode hash, call videonode.de API to get PlayCDN stream
  if (activeHash) {
    try {
      const apiRes = await fetch('https://videonode.de/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `https://videonode.de/iframe3/p2p/${activeHash}`,
          'Origin': 'https://videonode.de',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        body: `host=p2p&id=${encodeURIComponent(activeHash)}`,
      });

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData && apiData.embedUrl && apiData.embedUrl.includes('playcdn.de')) {
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
              const proxiedM3u8Url = `/api/embed?action=m3u8&url=${encodeURIComponent(verifyData.fileUrl)}`;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              return res
                .status(200)
                .send(renderCustomPlayer(proxiedM3u8Url, verifyData.title, verifyData.poster, serverMode));
            }
          }
        }
      }
    } catch (apiErr) {
      console.warn('videonode api.php request failed:', apiErr.message);
    }
  }

  // Fallback player if resolution or stream was unavailable
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(renderFallbackPlayer(cleanEpParam || targetUrl, serverMode));
}

/**
 * Resolves the genuine 22-character videonode streaming hash for any movie or episode
 */
async function resolveVideonodeUrlForEpisode(episodeSlug) {
  if (!episodeSlug) return null;
  const cleanEp = decodeURIComponent(episodeSlug).replace(/^\//, '').trim();
  const cacheKey = `resolved_${cleanEp}`;
  if (episodeCache.has(cacheKey)) {
    return episodeCache.get(cacheKey);
  }

  const epMatch = cleanEp.match(/-season-(\d+)-episode-(\d+)/i) || cleanEp.match(/episode-(\d+)/i);
  const currentEpNum = epMatch && epMatch[2] ? epMatch[2] : (epMatch ? epMatch[1] : '1');
  const cleanBase = cleanEp.replace(/-\d{4}$/, '');
  const seriesBase = cleanBase.replace(/-season-\d+-episode-\d+.*$/, '');
  const yearMatch = cleanEp.match(/\d{4}$/);
  const year = yearMatch ? yearMatch[0] : '2026';

  const candidates = [
    cleanEp,
    `/${cleanEp}`,
    cleanBase,
    `/${cleanBase}`,
    `${cleanBase}-season-1-episode-${currentEpNum}-${year}`,
    `/${cleanBase}-season-1-episode-${currentEpNum}-${year}`,
    `${cleanBase}-season-1-episode-${currentEpNum}-2026`,
    `${cleanBase}-season-1-episode-${currentEpNum}`,
    `${seriesBase}-season-1-episode-${currentEpNum}-${year}`,
    `${seriesBase}-season-1-episode-${currentEpNum}-2026`,
    `${seriesBase}-season-1-episode-${currentEpNum}`,
    `${cleanBase}-episode-${currentEpNum}`,
    `${seriesBase}-${year}`,
    `${seriesBase}-2026`,
    seriesBase,
  ];

  // 1. Fast in-memory lookup from verified hashes
  for (const cand of candidates) {
    const entry = KNOWN_EPISODE_HASHES[cand];
    if (entry) {
      const p2pUrl = entry.p2p || (typeof entry === 'string' ? entry : '');
      const hash = extractHash(p2pUrl);
      if (hash && isValidVideonodeHash(hash)) {
        const fullUrl = `https://videonode.de/iframe3/p2p/${hash}`;
        episodeCache.set(cacheKey, fullUrl);
        return fullUrl;
      }
    }
  }

  // 2. Upstream live scrape fallback from LK21 and NontonDrama
  const crawlCandidates = [
    `https://tv12.lk21official.cc/${cleanEp}`,
    `https://tv.nontondrama.vip/${cleanEp}`,
    `https://tv.nontondrama.vip/${seriesBase}-season-1-episode-${currentEpNum}-${year}`,
    `https://tv.nontondrama.vip/${seriesBase}-season-1-episode-${currentEpNum}-2026`,
    `https://tv.nontondrama.vip/${seriesBase}-season-1-episode-${currentEpNum}`,
    `https://tv12.lk21official.cc/${cleanBase}`,
    `https://tv.nontondrama.vip/${cleanBase}`,
  ];

  const seen = new Set();
  for (const pageUrl of crawlCandidates) {
    if (seen.has(pageUrl)) continue;
    seen.add(pageUrl);

    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) continue;

      const html = await res.text();
      // Match genuine videonode hash
      const hashMatch =
        html.match(/videonode\.de\/iframe3\/(?:p2p|cast|hydrax|turbovip)\/([a-zA-Z0-9_\-]{22})/i) ||
        html.match(/data-url=["']https:\/\/videonode\.de\/iframe3\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]{22})["']/i) ||
        html.match(/<iframe[^>]+src=["']https:\/\/videonode\.de\/iframe3\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]{22})/i);

      if (hashMatch && isValidVideonodeHash(hashMatch[1])) {
        const fullUrl = `https://videonode.de/iframe3/p2p/${hashMatch[1]}`;
        episodeCache.set(cacheKey, fullUrl);
        return fullUrl;
      }
    } catch {
      // Continue to next URL
    }
  }

  return null;
}

function getServerBadgeText(mode) {
  switch (mode) {
    case 'backup':
      return 'Server 2: HLS Cadangan (Server Cepat)';
    case 'mirror':
      return 'Server 3: HD Mirror (Stream Stabil)';
    case 'direct':
      return 'Server 4: Direct HD (Server Ringan)';
    case 'p2p':
    default:
      return 'Server 1: HLS VIP (Ultra HD • Sub Indo)';
  }
}

function renderCustomPlayer(proxiedM3u8Url, title = 'Video Player', poster = '', serverMode = 'p2p') {
  const badgeText = getServerBadgeText(serverMode);

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
    .spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.15); border-top-color: #e11d48; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; font-weight: 600; color: #e2e8f0; letter-spacing: 0.3px; }
    .sub-badge { font-size: 11px; color: #34d399; background: rgba(52, 211, 153, 0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(52, 211, 153, 0.3); }
    .status-badge { position: absolute; top: 12px; left: 12px; z-index: 5; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(225, 29, 72, 0.4); color: #fecdd3; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 8px; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 7px; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.6); }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #e11d48; box-shadow: 0 0 8px #e11d48; }
    .play-overlay { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); z-index: 8; cursor: pointer; }
    .play-btn { width: 68px; height: 68px; border-radius: 50%; background: #e11d48; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(225,29,72,0.5); transition: transform 0.2s; }
    .play-btn:hover { transform: scale(1.1); }
    .play-icon { width: 0; height: 0; border-top: 14px solid transparent; border-bottom: 14px solid transparent; border-left: 22px solid #fff; margin-left: 5px; }
  </style>
</head>
<body>
  <div id="video-container">
    <div class="status-badge">
      <div class="status-dot"></div>
      <span>${escapeHtml(badgeText)}</span>
    </div>

    <video id="player" controls playsinline poster="${escapeHtml(poster)}"></video>

    <div id="play-overlay" class="play-overlay" onclick="triggerPlay()">
      <div class="play-btn">
        <div class="play-icon"></div>
      </div>
    </div>

    <div id="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span class="loading-text">Menghubungkan stream video...</span>
      <span class="sub-badge">Subtitle Indonesia Otomatis</span>
    </div>
  </div>

  <script>
    const video = document.getElementById('player');
    const loading = document.getElementById('loading');
    const playOverlay = document.getElementById('play-overlay');
    const hlsUrl = "${proxiedM3u8Url}";
    const serverMode = "${serverMode}";
    let isHidden = false;

    function hideLoading() {
      if (!isHidden && loading) {
        isHidden = true;
        loading.style.opacity = '0';
        setTimeout(() => { loading.style.display = 'none'; }, 300);
      }
    }

    function triggerPlay() {
      if (playOverlay) playOverlay.style.display = 'none';
      video.play().catch(() => {});
    }

    if (Hls.isSupported()) {
      const hlsConfig = {
        enableWorker: serverMode !== 'direct',
        lowLatencyMode: serverMode === 'backup',
        backBufferLength: serverMode === 'mirror' ? 90 : 60,
        maxBufferLength: serverMode === 'mirror' ? 60 : (serverMode === 'backup' ? 20 : 30),
        maxMaxBufferLength: serverMode === 'mirror' ? 120 : 60
      };

      const hls = new Hls(hlsConfig);
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        hideLoading();
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(function() {
            // Autoplay blocked by browser policy: show play overlay
            if (playOverlay) playOverlay.style.display = 'flex';
          });
        }
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
      }, 4000);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', function() {
        hideLoading();
        video.play().catch(function() {
          if (playOverlay) playOverlay.style.display = 'flex';
        });
      });
    } else {
      hideLoading();
    }

    video.addEventListener('playing', () => { hideLoading(); if (playOverlay) playOverlay.style.display = 'none'; });
    video.addEventListener('canplay', hideLoading);
    video.addEventListener('loadeddata', hideLoading);
  </script>
</body>
</html>`;
}

function renderFallbackPlayer(targetTitle = '', serverMode = 'p2p') {
  const cleanDisplay = String(targetTitle || 'Film / Episode')
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/\/iframe3\/[^/]+\//, '')
    .replace(/-\d{4}$/, '')
    .replace(/[-_]/g, ' ')
    .trim();

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sinkronisasi Jalur Streaming</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #020617; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; }
    .card { background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 16px; padding: 28px 24px; max-width: 440px; text-align: center; color: #f8fafc; box-shadow: 0 16px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .icon-box { width: 54px; height: 54px; border-radius: 50%; background: rgba(225, 29, 72, 0.15); border: 1px solid rgba(225, 29, 72, 0.4); display: flex; align-items: center; justify-content: center; color: #e11d48; font-size: 26px; }
    h2 { font-size: 16px; font-weight: 700; color: #fff; }
    p { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .title-pill { font-size: 11px; background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 6px; color: #cbd5e1; font-weight: 600; }
    .btn { background: #e11d48; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #be123c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">▶</div>
    <h2>Menghubungkan Server Video</h2>
    <div class="title-pill">${escapeHtml(cleanDisplay)}</div>
    <p>Jalur streaming sedang disiapkan oleh sistem CDN. Silakan klik tombol di bawah untuk menyegarkan pemutar atau coba pilih server lain pada bilah pemutar.</p>
    <button class="btn" onclick="window.location.reload()">Muat Ulang Pemutar ↻</button>
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
