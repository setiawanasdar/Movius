import assert from 'assert';

console.log('====================================================');
console.log('       MOVIUS - COMPREHENSIVE END-TO-END TEST       ');
console.log('====================================================\n');

// 1. Mock LocalStorage for Node testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockLocalStorage();
globalThis.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

// 2. Test Formatters & Image URL https sanitization
import { formatRating, formatDuration, formatRelativeTime, getPosterUrl } from './src/utils/formatters.js';

console.log('[TEST 1] Testing Formatters & HTTPS Sanitization...');
assert.strictEqual(formatRating(8.4), '8.4');
assert.strictEqual(formatRating(null), 'N/A');
assert.strictEqual(formatDuration(125), '2:05');
assert.strictEqual(formatDuration(3665), '1j 01m');
assert.strictEqual(formatRelativeTime(Date.now() - 30000), 'Baru saja');
assert.strictEqual(getPosterUrl('http://img.com/p.jpg'), 'https://img.com/p.jpg');
console.log('  -> Formatters & HTTPS upgrade: ALL PASSED\n');

// 3. Test Storage Service
import { storageService } from './src/services/storageService.js';

console.log('[TEST 2] Testing Watchlist & Watch History Storage...');
storageService.addToWatchlist({
  slug: 'avatar-seven-havens-2026',
  title: 'Avatar: Seven Havens',
  poster: 'https://img.example.com/poster.jpg',
  rating: 8.4,
  year: 2026,
  genres: ['Action', 'Fantasy'],
  status: 'Ongoing',
  addedAt: Date.now(),
});
assert.strictEqual(storageService.isInWatchlist('avatar-seven-havens-2026'), true);
storageService.removeFromWatchlist('avatar-seven-havens-2026');
assert.strictEqual(storageService.isInWatchlist('avatar-seven-havens-2026'), false);

storageService.saveHistory({
  seriesSlug: 'avatar-seven-havens-2026',
  episodeSlug: 'avatar-seven-havens-season-1-episode-1-2026',
  seriesTitle: 'Avatar: Seven Havens',
  episodeTitle: 'Episode 1',
  poster: 'https://img.example.com/poster.jpg',
  season: 1,
  episodeNumber: 1,
  currentTime: 600,
  duration: 2700,
});
assert.strictEqual(storageService.getHistory().length, 1);
assert.strictEqual(storageService.getHistory()[0].percentage, 22);
storageService.clearAllHistory();
console.log('  -> Storage Service: ALL PASSED\n');

// 4. Test API Client & Comprehensive Fallbacks
import { apiClient } from './src/api/client.js';

console.log('[TEST 3] Testing All 14 API Endpoints with Resilient Fallback...');
async function runApiTests() {
  // Latest
  const latest = await apiClient('/api/latest');
  assert.ok(latest.items.length > 0, 'Latest items returned');

  // Popular
  const popular = await apiClient('/api/popular');
  assert.ok(popular.items.length > 0, 'Popular items returned');

  // Drakor
  const drakor = await apiClient('/api/drakor');
  assert.ok(drakor.items.length > 0, 'Drakor items returned');

  // Ongoing
  const ongoing = await apiClient('/api/ongoing');
  assert.ok(ongoing.items.length > 0, 'Ongoing items returned');

  // Completed
  const completed = await apiClient('/api/completed');
  assert.ok(completed.items.length > 0, 'Completed items returned');

  // Asian
  const asian = await apiClient('/api/asian');
  assert.ok(asian.items.length > 0, 'Asian items returned');

  // Western
  const west = await apiClient('/api/west');
  assert.ok(west.items.length > 0, 'Western items returned');

  // Genre filter
  const romance = await apiClient('/api/genre/romance');
  assert.ok(romance.items.length > 0, 'Genre romance items returned');

  // Country filter
  const korea = await apiClient('/api/country/south-korea');
  assert.ok(korea.items.length > 0, 'Country south-korea items returned');

  // Year filter
  const year2026 = await apiClient('/api/year/2026');
  assert.ok(year2026.items.length > 0, 'Year 2026 items returned');

  // Search keyword
  const searchDoctor = await apiClient('/api/search', { params: { keyword: 'doctor' } });
  assert.ok(searchDoctor.items.length > 0, 'Search for doctor returned');
  assert.ok(searchDoctor.items.some((i) => i.title.toLowerCase().includes('doctor')), 'Search filtered correctly');

  // Series Detail (Cached)
  const seriesDetailCached = await apiClient('/api/series/avatar-seven-havens-2026');
  assert.strictEqual(seriesDetailCached.results.slug, 'avatar-seven-havens-2026');
  assert.ok(seriesDetailCached.results.seasons.length > 0);

  // Series Detail (Dynamic from catalog)
  const seriesDetailDynamic = await apiClient('/api/series/deadly-tag-2026');
  assert.strictEqual(seriesDetailDynamic.results.slug, 'deadly-tag-2026');
  assert.strictEqual(seriesDetailDynamic.results.title, 'Deadly Tag');
  assert.ok(seriesDetailDynamic.results.seasons[0].episodes.length > 0);

  // Episode Stream (Dynamic from catalog)
  const episodeStream = await apiClient('/api/episode/deadly-tag-season-1-episode-2-2026');
  assert.strictEqual(episodeStream.results.episode, 2);
  assert.strictEqual(episodeStream.results.series.title, 'Deadly Tag');
  assert.ok(episodeStream.results.streaming.servers.length >= 3);
  assert.ok(episodeStream.results.streaming.servers[0].url.includes('deadly-tag'), 'Streaming server is scoped to Deadly Tag');
  assert.strictEqual(episodeStream.results.navigation.previous.slug, 'deadly-tag-season-1-episode-1-2026');

  console.log('  -> All 14 API Endpoints & Dynamic Details: ALL PASSED\n');

  // 4. Test Video Streaming Proxy Handler (embed.js)
  console.log('[TEST 4] Testing Video Streaming Proxy & HLS Resolution...');
  const { default: embedHandler } = await import('./api/embed.js');
  
  function createMockRes() {
    return {
      headers: {},
      statusCode: 200,
      setHeader(k, v) { this.headers[k] = v; },
      status(s) { this.statusCode = s; return this; },
      send(b) { this.body = b; return this; }
    };
  }

  // 4a. P2P host resolution into Custom Player with proxied m3u8
  const resP2P = createMockRes();
  await embedHandler({ method: 'GET', query: { url: 'https://videonode.de/iframe3/p2p/lV7EXXPf_LGYWGakpzMQVA' } }, resP2P);
  assert.strictEqual(resP2P.statusCode, 200);
  assert.ok(resP2P.body.includes('action=m3u8'), 'P2P player contains proxied m3u8 action');
  assert.ok(resP2P.body.includes('Hls.isSupported()'), 'P2P player contains Hls.js initialization');

  // 4b. CAST host resolution into clean Iframe wrapper
  const resCast = createMockRes();
  await embedHandler({ method: 'GET', query: { url: 'https://videonode.de/iframe3/cast/o4MVEsM7DbAAjqEC_wYpmw' } }, resCast);
  assert.strictEqual(resCast.statusCode, 200);
  assert.ok(resCast.body.includes('mfw09.org'), 'CAST resolves to clean embed url without CSP');

  // 4c. M3U8 proxy & segment URL rewriter
  const resM3u8 = createMockRes();
  await embedHandler({ method: 'GET', query: { action: 'm3u8', url: 'https://stream.playcdn.de/playlist/897ca92d9f320b964ab3c52faa85d442/1/0.m3u8?x=1' } }, resM3u8);
  assert.strictEqual(resM3u8.statusCode, 200);
  assert.ok(resM3u8.body.includes('/api/embed?action=segment'), 'M3u8 playlist lines rewritten to proxy segments');

  // 4d. Fallback on invalid stream URL
  const resFallback = createMockRes();
  await embedHandler({ method: 'GET', query: { url: 'https://videonode.de/invalid' } }, resFallback);
  assert.strictEqual(resFallback.statusCode, 200);
  assert.ok(resFallback.body.includes('Server Cadangan Aktif'), 'Fallback player renders gracefully');

  // 4e. Dynamic distinct episode resolution (Doctor X must not be Seven Havens)
  const resDoctorX = createMockRes();
  await embedHandler({ method: 'GET', query: { episode: 'doctor-x-age-white-mafia-season-1-episode-1-2026' } }, resDoctorX);
  assert.strictEqual(resDoctorX.statusCode, 200);
  assert.ok(resDoctorX.body.includes('Doctor X'), 'Resolves Doctor X specifically');
  assert.ok(!resDoctorX.body.includes('Seven Havens'), 'Doctor X does not load Seven Havens');

  console.log('  -> Video Streaming Proxy & HLS Resolution: ALL PASSED\n');

  console.log('====================================================');
  console.log('   ALL MOVIUS SUITE TESTS PASSED SUCCESSFULLY! (100%)');
  console.log('====================================================');
}

runApiTests();
