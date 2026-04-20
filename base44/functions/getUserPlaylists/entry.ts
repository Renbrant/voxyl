import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { userId, currentUserId } = body;

  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  // Fetch all playlists of that user using service role (bypasses RLS)
  const allPlaylists = await base44.asServiceRole.entities.Playlist.filter({ creator_id: userId }, '-created_date', 50);

  // Check if currentUser follows the target user (accepted)
  let isFollowing = false;
  if (currentUserId && currentUserId !== userId) {
    const follows = await base44.asServiceRole.entities.Follow.filter({
      follower_id: currentUserId,
      following_id: userId,
      status: 'accepted',
    });
    isFollowing = follows.length > 0;
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