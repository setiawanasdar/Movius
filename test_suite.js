import assert from 'assert';

console.log('====================================================');
console.log('       MOVIUS - CLIENT LOGIC & SERVICES TEST        ');
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

// 2. Test Formatters
import { formatRating, formatDuration, formatRelativeTime, getPosterUrl } from './src/utils/formatters.js';

console.log('[TEST 1] Testing Formatters...');
assert.strictEqual(formatRating(8.4), '8.4');
assert.strictEqual(formatRating(null), 'N/A');
assert.strictEqual(formatRating(undefined), 'N/A');
assert.strictEqual(formatDuration(125), '2:05');
assert.strictEqual(formatDuration(3665), '1j 01m');
assert.strictEqual(formatRelativeTime(Date.now() - 30000), 'Baru saja');
assert.ok(getPosterUrl('').includes('svg'));
console.log('  -> Formatters: ALL PASSED\n');

// 3. Test Storage Service
import { storageService } from './src/services/storageService.js';

console.log('[TEST 2] Testing Storage Service...');

// Watchlist
storageService.addToWatchlist({
  slug: 'avatar-seven-havens-2026',
  title: 'Avatar: Seven Havens',
  poster: 'https://img.example.com/poster.jpg',
  rating: 8.4,
  year: 2026,
  genres: ['Action', 'Fantasy'],
  status: 'Ongoing',
  addedAt: Date.now()
});
assert.strictEqual(storageService.isInWatchlist('avatar-seven-havens-2026'), true);
assert.strictEqual(storageService.getWatchlist().length, 1);

storageService.removeFromWatchlist('avatar-seven-havens-2026');
assert.strictEqual(storageService.isInWatchlist('avatar-seven-havens-2026'), false);
assert.strictEqual(storageService.getWatchlist().length, 0);

// Watch History
storageService.saveHistory({
  seriesSlug: 'avatar-seven-havens-2026',
  episodeSlug: 'avatar-seven-havens-season-1-episode-1-2026',
  seriesTitle: 'Avatar: Seven Havens',
  episodeTitle: 'Episode 1',
  poster: 'https://img.example.com/poster.jpg',
  season: 1,
  episodeNumber: 1,
  currentTime: 600,
  duration: 2700
});

const history = storageService.getHistory();
assert.strictEqual(history.length, 1);
assert.strictEqual(history[0].seriesSlug, 'avatar-seven-havens-2026');
assert.strictEqual(history[0].percentage, 22);

const prog = storageService.getHistoryItem('avatar-seven-havens-2026');
assert.ok(prog);
assert.strictEqual(prog.currentTime, 600);

storageService.clearAllHistory();
assert.strictEqual(storageService.getHistory().length, 0);

// Search History
storageService.addSearchQuery('doctor x');
storageService.addSearchQuery('avatar');
const searches = storageService.getSearchHistory();
assert.deepStrictEqual(searches, ['avatar', 'doctor x']);
console.log('  -> Storage Service: ALL PASSED\n');

// 4. Test Fallback Data integrity
import { FALLBACK_DATA } from './src/api/fallbackData.js';
console.log('[TEST 3] Testing Fallback Data Snapshot...');
assert.ok(FALLBACK_DATA.popular?.items?.length > 0, 'Popular items exist');
assert.ok(FALLBACK_DATA.latest?.items?.length > 0, 'Latest items exist');
assert.ok(FALLBACK_DATA.drakor?.items?.length > 0, 'Drakor items exist');
assert.ok(FALLBACK_DATA.genres?.results?.length > 0, 'Genres exist');
assert.ok(FALLBACK_DATA.countries?.results?.length > 0, 'Countries exist');
console.log(`  -> Popular Count: ${FALLBACK_DATA.popular.items.length}`);
console.log(`  -> Latest Count: ${FALLBACK_DATA.latest.items.length}`);
console.log(`  -> Drakor Count: ${FALLBACK_DATA.drakor.items.length}`);
console.log(`  -> Genres Count: ${FALLBACK_DATA.genres.results.length}`);
console.log(`  -> Countries Count: ${FALLBACK_DATA.countries.results.length}`);
console.log('  -> Fallback Data: ALL PASSED\n');

console.log('====================================================');
console.log('   ALL CLIENT LOGIC TESTS PASSED SUCCESSFULLY! (100%)');
console.log('====================================================');
