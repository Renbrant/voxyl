import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Build podcast metadata from playlist rss_feeds (no external fetching)
    const allPlaylists = await base44.asServiceRole.entities.Playlist.list('', 1000);
    const podcastMap = {};

    allPlaylists.forEach(playlist => {
      if (!playlist.rss_feeds) return;
      playlist.rss_feeds.forEach(feed => {
        if (!feed.url) return;
        if (!podcastMap[feed.url]) {
          podcastMap[feed.url] = {
            feedUrl: feed.url,
            title: feed.title || '',
            image: feed.image || '',
            description: feed.description || '',
            author: feed.author || '',
            playCount: 0,
          };
        }
        if (!podcastMap[feed.url].title && feed.title) podcastMap[feed.url].title = feed.title;
        if (!podcastMap[feed.url].image && feed.image) podcastMap[feed.url].image = feed.image;
      });
    });

    // Only count plays from the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const allPlays = await base44.asServiceRole.entities.PodcastPlay.list('-played_at', 10000);

    allPlays.forEach(play => {
      if (!play.feed_url) return;
      if (play.played_at && play.played_at < oneWeekAgo) return;

      if (!podcastMap[play.feed_url]) {
        podcastMap[play.feed_url] = {
          feedUrl: play.feed_url,
          title: play.podcast_title || '',
          image: play.podcast_image || '',
          description: '',
          author: '',
          playCount: 0,
        };
      }
      podcastMap[play.feed_url].playCount++;
      if (!podcastMap[play.feed_url].title && play.podcast_title) podcastMap[play.feed_url].title = play.podcast_title;
      if (!podcastMap[play.feed_url].image && play.podcast_image) podcastMap[play.feed_url].image = play.podcast_image;
    });

    const sorted = Object.values(podcastMap)
      .filter(p => p.title)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 50);

    return Response.json(sorted);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});