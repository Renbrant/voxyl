import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Only count plays from the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentPlays = await base44.asServiceRole.entities.PodcastPlay.list('-played_at', 10000);

    // Count plays per feed_url in the last week
    const feedPlayCount = {};
    recentPlays.forEach(play => {
      if (!play.feed_url) return;
      if (play.played_at && play.played_at < oneWeekAgo) return;
      feedPlayCount[play.feed_url] = (feedPlayCount[play.feed_url] || 0) + 1;
    });

    // Fetch all public playlists
    const allPlaylists = await base44.asServiceRole.entities.Playlist.list('', 1000);

    // Score each playlist by sum of plays of its feeds in the last week
    const scored = allPlaylists
      .filter(p => p.visibility === 'public' || !p.visibility)
      .map(p => {
        const weeklyPlays = (p.rss_feeds || []).reduce((sum, feed) => {
          return sum + (feedPlayCount[feed.url] || 0);
        }, 0);
        return { ...p, weeklyPlays };
      })
      .sort((a, b) => b.weeklyPlays - a.weeklyPlays);

    return Response.json({ playlists: scored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});