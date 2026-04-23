// Persistent cache for user's saved content (playlists, podcasts, follows)
// Loads instantly from localStorage, syncs with cloud in background

const CACHE_KEYS = {
  MY_PLAYLISTS: (userId) => `saved_my_playlists_${userId}`,
  LIKED_PLAYLISTS: (userId) => `saved_liked_playlists_${userId}`,
  LIKED_PLAYLISTS_DATA: (userId) => `saved_liked_playlists_data_${userId}`,
  LIKED_PODCASTS: (userId) => `saved_liked_podcasts_${userId}`,
  FOLLOWS: (userId) => `saved_follows_${userId}`,
  TIMESTAMPS: (userId) => `saved_timestamps_${userId}`,
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getTimestamp(key) {
  try {
    const timestamps = JSON.parse(localStorage.getItem(CACHE_KEYS.TIMESTAMPS('')) || '{}');
    return timestamps[key] || 0;
  } catch {
    return 0;
  }
}

function setTimestamp(key) {
  try {
    const timestamps = JSON.parse(localStorage.getItem(CACHE_KEYS.TIMESTAMPS('')) || '{}');
    timestamps[key] = Date.now();
    localStorage.setItem(CACHE_KEYS.TIMESTAMPS(''), JSON.stringify(timestamps));
  } catch {}
}

function isExpired(key) {
  const timestamp = getTimestamp(key);
  return Date.now() - timestamp > CACHE_TTL_MS;
}

// Get cached data if available and not expired
export function getCachedContent(userId, contentType) {
  try {
    const key = CACHE_KEYS[contentType]?.(userId);
    if (!key) return null;

    const cached = localStorage.getItem(key);
    if (!cached) return null;

    // Check if expired
    if (isExpired(key)) {
      localStorage.removeItem(key);
      return null;
    }

    return JSON.parse(cached);
  } catch {
    return null;
  }
}

// Cache data locally
export function setCachedContent(userId, contentType, data) {
  try {
    const key = CACHE_KEYS[contentType]?.(userId);
    if (!key) return false;

    localStorage.setItem(key, JSON.stringify(data));
    setTimestamp(key);
    return true;
  } catch {
    return false;
  }
}

// Clear specific cache
export function clearContentCache(userId, contentType) {
  try {
    const key = CACHE_KEYS[contentType]?.(userId);
    if (!key) return;
    localStorage.removeItem(key);
  } catch {}
}

// Clear all user content cache
export function clearAllContentCache(userId) {
  try {
    Object.values(CACHE_KEYS).forEach(keyFn => {
      const key = keyFn(userId);
      localStorage.removeItem(key);
    });
  } catch {}
}

// Check if cache is expired
export function isCacheExpired(userId, contentType) {
  const key = CACHE_KEYS[contentType]?.(userId);
  if (!key) return true;
  return isExpired(key);
}