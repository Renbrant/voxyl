import { getFeedFromCache } from '@/lib/feedCache';

/**
 * Get cover image for playlist
 * If playlist has cover_image, return it
 * Otherwise, get the image from the podcast with most episodes
 */
export function getPlaylistCoverImage(playlist) {
  if (playlist?.cover_image) {
    return playlist.cover_image;
  }

  // Find podcast with most episodes
  const feeds = playlist?.rss_feeds || [];
  if (feeds.length === 0) return null;

  let maxEpisodeCount = 0;
  let coverImage = null;

  feeds.forEach(feed => {
    const cached = getFeedFromCache(feed.url);
    const episodeCount = cached?.items?.length || 0;

    if (episodeCount > maxEpisodeCount) {
      maxEpisodeCount = episodeCount;
      coverImage = cached?.image || feed.image || null;
    }
  });

  return coverImage;
}