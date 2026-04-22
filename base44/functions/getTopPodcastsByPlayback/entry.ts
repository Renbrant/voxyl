import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all episode progress records
    const allProgress = await base44.entities.EpisodeProgress.list('-updated_date', 10000);

    // Map to count by domain (simple grouping by hostname)
    const domainMap = {};

    allProgress.forEach(progress => {
      // Count if marked as finished OR played 70%+
      const isMarkedFinished = progress.finished;
      const isPlayed70Plus = progress.duration_seconds > 0 && 
        (progress.position_seconds / progress.duration_seconds) >= 0.7;

      if (!isMarkedFinished && !isPlayed70Plus) return;

      // Extract hostname from audio URL
      const audioUrl = progress.audio_url || '';
      if (!audioUrl) return;

      try {
        const urlObj = new URL(audioUrl);
        const hostname = urlObj.hostname;
        
        if (!domainMap[hostname]) {
          domainMap[hostname] = { playCount: 0, sampleUrl: audioUrl };
        }
        domainMap[hostname].playCount++;
      } catch {
        // Skip invalid URLs
      }
    });

    // Now fetch all playlists to match domains with podcast info
    const allPlaylists = await base44.entities.Playlist.list('', 1000);
    const hostnameToPodcast = {};

    allPlaylists.forEach(playlist => {
      if (!playlist.rss_feeds) return;
      
      playlist.rss_feeds.forEach(feed => {
        try {
          const feedUrl = new URL(feed.url);
          const hostname = feedUrl.hostname;
          
          // Store first matching podcast info for each hostname
          if (!hostnameToPodcast[hostname]) {
            hostnameToPodcast[hostname] = {
              feedUrl: feed.url,
              title: feed.title || 'Sem título',
              image: feed.image || '',
              description: feed.description || '',
            };
          }
        } catch {
          // Skip invalid URLs
        }
      });
    });

    // Combine: add podcast info to play counts
    const podcasts = [];
    for (const hostname of Object.keys(domainMap)) {
      const podcastInfo = hostnameToPodcast[hostname];
      if (podcastInfo) {
        podcasts.push({
          ...podcastInfo,
          playCount: domainMap[hostname].playCount
        });
      }
    }

    // Sort by play count and return top 100
    const sorted = podcasts
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 100);

    return Response.json({ podcasts: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});