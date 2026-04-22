import { base44 } from '@/api/base44Client';

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
    
    // Save to cloud cache in background
    saveRSSCacheToCloud(url, data).catch(() => {});
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

// Cloud cache functions for RSS feeds
async function saveRSSCacheToCloud(feedUrl, feedData) {
  try {
    const existing = await base44.asServiceRole.entities.RSSCache.filter({ feed_url: feedUrl });
    const data = JSON.stringify(feedData);
    const now = new Date().toISOString();
    
    if (existing[0]) {
      await base44.asServiceRole.entities.RSSCache.update(existing[0].id, {
        data,
        cached_at: now
      });
    } else {
      await base44.asServiceRole.entities.RSSCache.create({
        feed_url: feedUrl,
        data,
        cached_at: now
      });
    }
  } catch (error) {
    console.error('Error saving RSS to cloud cache:', error);
  }
}

export async function getRSSCacheFromCloud(feedUrl) {
  try {
    const records = await base44.asServiceRole.entities.RSSCache.filter({ feed_url: feedUrl });
    if (!records[0]) return null;
    
    const cached_at = new Date(records[0].cached_at).getTime();
    const isExpired = Date.now() - cached_at > CACHE_TTL_MS;
    
    if (isExpired) {
      await base44.asServiceRole.entities.RSSCache.delete(records[0].id);
      return null;
    }
    
    return JSON.parse(records[0].data);
  } catch (error) {
    console.error('Error reading RSS from cloud cache:', error);
    return null;
  }
}