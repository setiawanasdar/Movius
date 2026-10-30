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

  const { action, url: queryUrl } = req.query;

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
  if (!queryUrl) {
    return res.status(400).send('Missing url parameter');
  }

  const targetUrl = decodeURIComponent(queryUrl);

  try {
    const videonodeMatch = targetUrl.match(/\/iframe3\/([^/]+)\/([^/?]+)/);
    if (videonodeMatch) {
      const host = videonodeMatch[1];
      const id = videonodeMatch[2];

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
    return res.status(200).send(renderFallbackPlayer(targetUrl));
  } catch (err) {
    console.error('Embed handler failed:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderFallbackPlayer(targetUrl));
  }
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
    .status-badge { position: absolute; top: 12px; left: 12px; z-index: 5; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 11px; padding: 4px 10px; border-radius: 6px; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 6px; pointer-events: none; }
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
          // Autoplay was prevented by browser policy (e.g. user gesture required)
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

      // Watchdog: If stalled for more than 5s, try startLoad
      setTimeout(() => {
        if (!isHidden) {
          hls.startLoad();
        }
      }, 5000);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari iOS HLS support
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', function() {
        hideLoading();
        video.play().catch(function() {});
      });
    } else {
      // Standard video fallback
      video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
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

function renderFallbackPlayer(targetUrl) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Movius Video Player</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #video-container { position: relative; width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; outline: none; }
    .badge { position: absolute; top: 12px; left: 12px; z-index: 20; background: rgba(225, 29, 72, 0.9); color: #fff; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 8px; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .ext-btn { position: absolute; top: 12px; right: 12px; z-index: 20; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255,255,255,0.15); color: #f1f5f9; text-decoration: none; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 8px; backdrop-filter: blur(8px); transition: all 0.2s; }
    .ext-btn:hover { background: #e11d48; color: #fff; border-color: #e11d48; }
  </style>
</head>
<body>
  <div id="video-container">
    <div class="badge">
      <span>● Server Cadangan Aktif</span>
    </div>
    ${
      targetUrl && targetUrl.startsWith('http')
        ? `<a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="ext-btn">Buka Tab Baru ↗</a>`
        : ''
    }
    <video
      id="player"
      controls
      playsinline
      autoplay
      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    ></video>
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
