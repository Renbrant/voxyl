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
        // Prefer non-empty title/image from any playlist that has it
        if (!podcastMap[feed.url].title && feed.title) podcastMap[feed.url].title = feed.title;
        if (!podcastMap[feed.url].image && feed.image) podcastMap[feed.url].image = feed.image;
      });
    });

    // Count plays from PodcastPlay records (admin-only entity)
    const allPlays = await base44.asServiceRole.entities.PodcastPlay.list('-played_at', 10000);
    allPlays.forEach(play => {
      if (play.feed_url && podcastMap[play.feed_url]) {
        podcastMap[play.feed_url].playCount++;
        // Fill metadata from play records if missing
        if (!podcastMap[play.feed_url].title && play.podcast_title) {
          podcastMap[play.feed_url].title = play.podcast_title;
        }
        if (!podcastMap[play.feed_url].image && play.podcast_image) {
          podcastMap[play.feed_url].image = play.podcast_image;
        }
      }
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