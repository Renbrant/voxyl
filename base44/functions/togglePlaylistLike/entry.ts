// v2
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { playlist_id } = await req.json();
    if (!playlist_id) return Response.json({ error: 'playlist_id required' }, { status: 400 });

    // Check if already liked (use service role to avoid RLS issues)
    const existing = await base44.asServiceRole.entities.PlaylistLike.filter({ playlist_id, user_id: user.id });
    const liked = existing.length > 0;

    if (liked) {
      await base44.asServiceRole.entities.PlaylistLike.delete(existing[0].id);
    } else {
      await base44.asServiceRole.entities.PlaylistLike.create({ playlist_id, user_id: user.id, user_email: user.email });
    }

    // Update likes_count using service role (bypasses RLS)
    const playlist = await base44.asServiceRole.entities.Playlist.get(playlist_id);
    if (playlist) {
      const current = playlist.likes_count || 0;
      await base44.asServiceRole.entities.Playlist.update(playlist_id, {
        likes_count: liked ? Math.max(0, current - 1) : current + 1,
      });
    }

    return Response.json({ liked: !liked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});