import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all playlists to get podcast feeds
    const allPlaylists = await base44.entities.Playlist.list('', 1000);
    const podcastMap = {};

    allPlaylists.forEach(playlist => {
      if (!playlist.rss_feeds) return;
      playlist.rss_feeds.forEach(feed => {
        if (!podcastMap[feed.url]) {
          podcastMap[feed.url] = {
            feedUrl: feed.url,
            title: feed.title || 'Sem título',
            image: feed.image || '',
            description: feed.description || '',
            playCount: 0,
            episodes: []
          };
        }
      });
    });

    // Fetch episodes for each podcast and cache audio URLs
    for (const feedUrl of Object.keys(podcastMap)) {
      try {
        const feedResult = await base44.functions.invoke('fetchRSSFeed', { 
          url: feedUrl, 
          count: 200 
        });
        
        const episodes = feedResult.data?.items || [];
        podcastMap[feedUrl].episodes = episodes.map(e => e.audioUrl).filter(Boolean);
      } catch {
        // Feed fetch failed
      }
    }

    // Fetch all episode progress records
    const allProgress = await base44.entities.EpisodeProgress.list('-updated_date', 10000);
    
    // Count plays per podcast
    allProgress.forEach(progress => {
      const audioUrl = progress.audio_url;
      if (!audioUrl) return;

      // Count if marked as finished OR played 70%+
      const isFinished = progress.finished === true;
      const isPct70 = progress.duration_seconds && progress.position_seconds 
        ? (progress.position_seconds / progress.duration_seconds) >= 0.7 
        : false;

      if (!isFinished && !isPct70) return;

      // Find which podcast this audio belongs to
      for (const feedUrl of Object.keys(podcastMap)) {
        if (podcastMap[feedUrl].episodes.includes(audioUrl)) {
          podcastMap[feedUrl].playCount++;
          break;
        }
      }
    });

    // Filter and sort — show all podcasts, sorted by play count
    const sorted = Object.values(podcastMap)
      .filter(p => p.title && p.title !== 'Sem título')
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 100);

    return Response.json(sorted);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});