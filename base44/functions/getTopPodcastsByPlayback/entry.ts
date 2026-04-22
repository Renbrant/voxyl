import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all playlists to map audio URLs to podcast feeds
    const allPlaylists = await base44.entities.Playlist.list('', 1000);
    
    // Build a map of audio URLs to podcast info
    const urlToPodcastMap = {};
    
    allPlaylists.forEach(playlist => {
      if (!playlist.rss_feeds) return;
      
      playlist.rss_feeds.forEach(feed => {
        if (urlToPodcastMap[feed.url]) return; // Already mapped
        urlToPodcastMap[feed.url] = {
          feedUrl: feed.url,
          title: feed.title || 'Sem título',
          image: feed.image || '',
          description: feed.description || '',
          playCount: 0
        };
      });
    });

    // Fetch all episode progress records
    const allProgress = await base44.entities.EpisodeProgress.list('-updated_date', 10000);

    // Count by feed URL
    const podcastMap = {};

    allProgress.forEach(progress => {
      // Count if marked as finished OR played 70%+
      const isMarkedFinished = progress.finished;
      const isPlayed70Plus = progress.duration_seconds > 0 && 
        (progress.position_seconds / progress.duration_seconds) >= 0.7;

      if (!isMarkedFinished && !isPlayed70Plus) return;

      // Find which podcast feed this audio URL belongs to
      // by matching against feeds in playlists
      let matchedFeed = null;
      
      for (const feedUrl of Object.keys(urlToPodcastMap)) {
        // Check if this audio URL likely belongs to this feed
        // We do a simple domain matching as a heuristic
        if (progress.audio_url && progress.audio_url.includes(feedUrl.split('/')[2])) {
          matchedFeed = feedUrl;
          break;
        }
      }

      if (!matchedFeed) return; // Skip if can't determine podcast

      if (!podcastMap[matchedFeed]) {
        podcastMap[matchedFeed] = {
          ...urlToPodcastMap[matchedFeed],
          playCount: 0
        };
      }
      podcastMap[matchedFeed].playCount++;
    });

    // Sort by play count and return top 100
    const sorted = Object.values(podcastMap)
      .filter(p => p.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 100);

    return Response.json({ podcasts: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});