import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - THREE_YEARS_MS).toISOString();

    // Get all playlists
    const allPlaylists = await base44.asServiceRole.entities.Playlist.list('-created_date', 1000);

    let deleted = 0;
    for (const pl of allPlaylists) {
      // Check last play date: use updated_date as proxy (plays_count update touches updated_date)
      // Also check if plays_count is 0 and playlist is old enough
      const lastActivity = pl.updated_date || pl.created_date;
      if (lastActivity && lastActivity < cutoff) {
        await base44.asServiceRole.entities.Playlist.delete(pl.id);
        deleted++;
      }
    }

    return Response.json({ deleted, cutoff, checked: allPlaylists.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});