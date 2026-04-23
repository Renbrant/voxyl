import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    const userId = user?.id || 'VISITOR';

    const { feed_url, podcast_title, podcast_image, audio_url, episode_title } = await req.json();

    if (!feed_url || !audio_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if this play was already recorded (avoid duplicates)
    const existing = await base44.asServiceRole.entities.PodcastPlay.filter({
      feed_url,
      user_id: userId,
      audio_url
    });

    if (existing.length > 0) {
      return Response.json({ recorded: false, message: 'Play already recorded' });
    }

    // Record the play
    await base44.asServiceRole.entities.PodcastPlay.create({
      feed_url,
      podcast_title: podcast_title || 'Unknown',
      podcast_image: podcast_image || '',
      user_id: userId,
      audio_url,
      episode_title: episode_title || 'Unknown',
      played_at: new Date().toISOString()
    });

    return Response.json({ recorded: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});