const CACHE_KEY_PREFIX = 'voxyl_feed_';
const INDEX_KEY = 'voxyl_feed_index';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CACHE_ENTRIES = 100;

function getCacheKey(url) {
  return CACHE_KEY_PREFIX + btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
}

function getIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY)) || {};
  } catch {
    return {};
  }
}

function saveIndex(index) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {}
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
    const key = getCacheKey(url);
    const index = getIndex();
    index[key] = Date.now();
    
    // Check if we need to prune
    if (Object.keys(index).length >= MAX_CACHE_ENTRIES) {
      pruneOldEntries(index);
    }
    
    localStorage.setItem(key, JSON.stringify({ cachedAt: Date.now(), data }));
    saveIndex(index);
  } catch {
    // Storage full — ignore
  }
}

export function invalidateFeedCache(url) {
  try {
    localStorage.removeItem(getCacheKey(url));
  } catch {}
}

function pruneOldEntries(index) {
  try {
    const entries = Object.entries(index).sort((a, b) => a[1] - b[1]);
    const toRemove = entries.slice(0, Math.floor(MAX_CACHE_ENTRIES / 2));
    toRemove.forEach(([key]) => {
      localStorage.removeItem(key);
      delete index[key];
    });
  } catch {}
}