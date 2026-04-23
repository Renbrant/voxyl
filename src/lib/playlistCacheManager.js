import { base44 } from '@/api/base44Client';

const CACHE_PREFIX = 'playlist_episodes_';
const CACHE_HASH_PREFIX = 'playlist_hash_';
const CACHE_TIMESTAMP_PREFIX = 'playlist_timestamp_';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Simple hash function for episodes
function hashEpisodes(episodes) {
  if (!episodes || episodes.length === 0) return '';
  return episodes.map(e => e.audioUrl || e.link).join('|');
}

// Get local cache
export function getLocalCache(playlistId) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + playlistId);
    const hash = localStorage.getItem(CACHE_HASH_PREFIX + playlistId);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_PREFIX + playlistId);
    
    if (!cached) return null;
    
    return {
      episodes: JSON.parse(cached),
      hash,
      timestamp: parseInt(timestamp || 0)
    };
  } catch {
    return null;
  }
}

// Save local cache
export function saveLocalCache(playlistId, episodes) {
  try {
    const hash = hashEpisodes(episodes);
    const timestamp = Date.now();
    
    localStorage.setItem(CACHE_PREFIX + playlistId, JSON.stringify(episodes));
    localStorage.setItem(CACHE_HASH_PREFIX + playlistId, hash);
    localStorage.setItem(CACHE_TIMESTAMP_PREFIX + playlistId, timestamp.toString());
    
    return { episodes, hash, timestamp };
  } catch {
    return null;
  }
}

// Get cloud cache
export async function getCloudCache(playlistId) {
  try {
    const records = await base44.entities.PlaylistEpisodesCache.filter({ playlist_id: playlistId });
    if (!records[0]) return null;
    
    const record = records[0];
    return {
      episodes: JSON.parse(record.episodes_data || '[]'),
      hash: record.episodes_hash,
      timestamp: new Date(record.last_updated).getTime()
    };
  } catch {
    return null;
  }
}

// Update cloud cache
export async function updateCloudCache(playlistId, episodes) {
  try {
    const hash = hashEpisodes(episodes);
    const data = JSON.stringify(episodes);
    const now = new Date().toISOString();
    
    const existing = await base44.entities.PlaylistEpisodesCache.filter({ playlist_id: playlistId });
    
    if (existing[0]) {
      await base44.entities.PlaylistEpisodesCache.update(existing[0].id, {
        episodes_hash: hash,
        episodes_data: data,
        last_updated: now
      });
    } else {
      await base44.entities.PlaylistEpisodesCache.create({
        playlist_id: playlistId,
        episodes_hash: hash,
        episodes_data: data,
        last_updated: now
      });
    }
    
    return { episodes, hash, timestamp: Date.now() };
  } catch (error) {
    console.error('Error updating cloud cache:', error);
    return null;
  }
}

// Main cache manager function
export async function getPlaylistEpisodes(playlistId, forceRefresh = false) {
  // 1. Load local cache instantly
  const localCache = getLocalCache(playlistId);
  if (localCache?.episodes?.length) {
    // Return local cache immediately but continue checking cloud
    const result = {
      episodes: localCache.episodes,
      source: 'local',
      isStale: false
    };
    
    // Check if we need to verify cloud cache
    const isOlderThanAnHour = localCache.timestamp < Date.now() - CACHE_DURATION_MS;
    
    if (forceRefresh || isOlderThanAnHour) {
      // Fetch cloud cache in background
      getCloudCache(playlistId).then(cloudCache => {
        if (cloudCache && cloudCache.hash && cloudCache.hash !== localCache.hash) {
          // Cloud has different data, update local
          saveLocalCache(playlistId, cloudCache.episodes);
        }
      }).catch(err => console.error('Error checking cloud cache:', err));
    }
    
    return result;
  }
  
  // 2. If no local cache, try cloud
  const cloudCache = await getCloudCache(playlistId);
  if (cloudCache?.episodes?.length) {
    saveLocalCache(playlistId, cloudCache.episodes);
    return {
      episodes: cloudCache.episodes,
      source: 'cloud',
      isStale: false
    };
  }
  
  // 3. No cache available, need to fetch fresh
  return {
    episodes: [],
    source: 'none',
    isStale: true
  };
}

// Get cloud episodes (aggregated)
export async function getCloudEpisodes(playlistId) {
  try {
    const records = await base44.entities.PlaylistEpisodesCache.filter({ playlist_id: playlistId });
    if (!records[0]) return null;
    
    return {
      episodes: JSON.parse(records[0].episodes_data || '[]'),
      hash: records[0].episodes_hash,
      timestamp: new Date(records[0].last_updated).getTime()
    };
  } catch {
    return null;
  }
}

// After fetching fresh episodes, update both caches
export async function saveFreshEpisodes(playlistId, episodes) {
  // Save to local cache
  saveLocalCache(playlistId, episodes);
  
  // Update cloud cache
  await updateCloudCache(playlistId, episodes);
  
  return episodes;
}

// Clear cache
export function clearCache(playlistId) {
  localStorage.removeItem(CACHE_PREFIX + playlistId);
  localStorage.removeItem(CACHE_HASH_PREFIX + playlistId);
  localStorage.removeItem(CACHE_TIMESTAMP_PREFIX + playlistId);
}