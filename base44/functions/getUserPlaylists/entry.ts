import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { userId, currentUserId } = body;

  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  // Fetch all playlists — list all and filter manually to ensure RLS bypass works
  const allPlaylistsRaw = await base44.asServiceRole.entities.Playlist.list('-created_date', 200);
  const allPlaylists = allPlaylistsRaw.filter(p => p.creator_id === userId);

  // Check if currentUser follows the target user (accepted)
  // Fetch all follows by currentUser and filter in-memory to avoid multi-field filter issues
  let isFollowing = false;
  if (currentUserId && currentUserId !== userId) {
    const allFollows = await base44.asServiceRole.entities.Follow.list('-created_date', 500);
    const match = allFollows.find(f => f.follower_id === currentUserId && f.following_id === userId);
    isFollowing = match?.status === 'accepted';
  }

  const isOwner = currentUserId === userId;

  // Filter based on visibility and relationship
  const visible = allPlaylists.filter(p => {
    if (isOwner) return true;
    if (!p.visibility || p.visibility === 'public') return true;
    if (p.visibility === 'friends_only') return isFollowing;
    return false;
  });

  return Response.json({ playlists: visible, isFollowing });
});