/**
 * Generic localStorage cache with TTL support.
 * Used for app data like playlists, likes, etc.
 */

export function getCache(key) {
  try {
    const raw = localStorage.getItem('voxyl_cache_' + key);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem('voxyl_cache_' + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data, ttlMs) {
  try {
    localStorage.setItem('voxyl_cache_' + key, JSON.stringify({
      data,
      expiresAt: Date.now() + ttlMs,
    }));
  } catch {}
}

export function invalidateCache(key) {
  try {
    localStorage.removeItem('voxyl_cache_' + key);
  } catch {}
}

export function invalidateCachePrefix(prefix) {
  try {
    const fullPrefix = 'voxyl_cache_' + prefix;
    Object.keys(localStorage)
      .filter(k => k.startsWith(fullPrefix))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

// TTL constants
export const TTL_5MIN   = 5  * 60 * 1000;
export const TTL_15MIN  = 15 * 60 * 1000;
export const TTL_1HOUR  = 60 * 60 * 1000;
export const TTL_4HOUR  = 4  * 60 * 60 * 1000;
export const TTL_1DAY   = 24 * 60 * 60 * 1000;