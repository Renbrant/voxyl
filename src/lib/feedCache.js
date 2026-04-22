const CACHE_KEY_PREFIX = 'voxyl_feed_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CACHE_ENTRIES = 100;

function getCacheKey(url) {
  return CACHE_KEY_PREFIX + btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
}

export function getFeedFromCache(url) {
  try {
    const key = getCacheKey(url);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function saveFeedToCache(url, data) {
  try {
    pruneOldEntries();
    const key = getCacheKey(url);
    localStorage.setItem(key, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {
    // Storage full — ignore
  }
}

export function invalidateFeedCache(url) {
  try {
    localStorage.removeItem(getCacheKey(url));
  } catch {}
}

function pruneOldEntries() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
    if (keys.length < MAX_CACHE_ENTRIES) return;
    // Remove oldest entries
    const entries = keys.map(k => {
      try { return { k, cachedAt: JSON.parse(localStorage.getItem(k)).cachedAt }; } catch { return { k, cachedAt: 0 }; }
    }).sort((a, b) => a.cachedAt - b.cachedAt);
    entries.slice(0, Math.floor(MAX_CACHE_ENTRIES / 2)).forEach(e => localStorage.removeItem(e.k));
  } catch {}
}