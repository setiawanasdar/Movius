export default async function handler(req, res) {
  // Set CORS and frame ancestors to allow embedding on our web app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('X-Frame-Options', 'ALLOWALL');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const rawUrl = req.query.url;
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  const targetUrl = decodeURIComponent(rawUrl);

  try {
    // 1. Try extracting videonode ID & host to get direct HLS stream
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
                // We got the direct HLS .m3u8 playlist stream!
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                return res.status(200).send(renderCustomPlayer(verifyData.fileUrl, verifyData.title, verifyData.poster));
              }
            }
          }
        }
      } catch (innerErr) {
        console.warn('Direct stream resolution failed, attempting HTML proxy:', innerErr.message);
      }
    }

    // 2. Fallback: Fetch the original HTML, strip CSP and frame-busting, and proxy it
    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://tv.nontondrama.vip/',
    };

    const upstreamRes = await fetch(targetUrl, { headers: fetchHeaders });
    let html = await upstreamRes.text();

    // Strip frame-busting scripts
    html = html.replace(/if\s*\(\s*window\.self\s*===\s*window\.top\s*\)\s*\{[^}]*\}/gi, '/* frame-busting removed */');
    html = html.replace(/window\.location\.replace\([^)]*\)/gi, '/* redirect removed */');
    html = html.replace(/devtoolIsOpening\(\);?/gi, '/* anti-devtool removed */');

    // Fix relative assets to absolute videonode/playcdn URLs
    const baseOrigin = new URL(targetUrl).origin;
    html = html.replace(/(href|src)=["']\/([^"']+)["']/gi, `$1="${baseOrigin}/$2"`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Embed proxy failed:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderErrorFallback(targetUrl));
  }
}

function renderCustomPlayer(hlsUrl, title = 'Video Player', poster = '') {
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
    #video-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; outline: none; }
    .loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); color: #fff; z-index: 10; gap: 12px; }
    .spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.2); border-top-color: #e11d48; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg { color: #f87171; font-size: 14px; text-align: center; padding: 16px; }
  </style>
</head>
<body>
  <div id="video-container">
    <video id="player" controls playsinline autoplay poster="${escapeHtml(poster)}"></video>
    <div id="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span style="font-size: 13px; font-weight: 600; color: #cbd5e1;">Memuat video stream...</span>
    </div>
  </div>

  <script>
    const video = document.getElementById('player');
    const loading = document.getElementById('loading');
    const hlsUrl = "${hlsUrl}";

    function hideLoading() {
      if (loading) loading.style.display = 'none';
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        hideLoading();
        video.play().catch(function() {
          // Autoplay was prevented by browser policy
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
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari iOS HLS support
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', function() {
        hideLoading();
        video.play().catch(function() {});
      });
    } else {
      loading.innerHTML = '<div class="error-msg">Browser Anda tidak mendukung pemutar HLS video ini.</div>';
    }

    video.addEventListener('playing', hideLoading);
    video.addEventListener('canplay', hideLoading);
  </script>
</body>
</html>`;
}

function renderErrorFallback(targetUrl) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    body { background: #090a0f; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { max-width: 420px; padding: 24px; border-radius: 16px; background: #11131a; border: 1px solid #2a2e3d; }
    h3 { margin-bottom: 8px; color: #f87171; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 10px 20px; background: #e11d48; color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; }
  </style>
</head>
<body>
  <div class="box">
    <h3>Server Streaming Sedang Sibuk</h3>
    <p>Server video sedang mengalami proteksi koneksi. Anda dapat memutar langsung di tab baru atau memilih server lain di menu bawah.</p>
    <a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn">Buka Pemutar di Tab Baru ↗</a>
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
