import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { playlist_id, plays_count } = await req.json();

    if (!playlist_id) return Response.json({ error: 'Missing playlist_id' }, { status: 400 });

    await base44.asServiceRole.entities.Playlist.update(playlist_id, { plays_count });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});