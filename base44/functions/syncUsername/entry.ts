import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await req.json();
    if (!username) return Response.json({ error: 'username required' }, { status: 400 });

    // Use service role to find ALL playlists by this user (bypasses RLS)
    const allPlaylists = await base44.asServiceRole.entities.Playlist.filter({ creator_id: user.id });
    await Promise.all(allPlaylists.map(p =>
      base44.asServiceRole.entities.Playlist.update(p.id, { creator_username: username })
    ));

    return Response.json({ updated: allPlaylists.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});