import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { userId } = await req.json();

  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const currentUser = await base44.auth.me().catch(() => null);

  // Fetch all playlists of that user using service role
  const allPlaylists = await base44.asServiceRole.entities.Playlist.filter({ creator_id: userId }, '-created_date', 50);

  // Check if currentUser follows the target user (accepted)
  let isFollowing = false;
  if (currentUser) {
    const follows = await base44.asServiceRole.entities.Follow.filter({
      follower_id: currentUser.id,
      following_id: userId,
      status: 'accepted',
    });
    isFollowing = follows.length > 0;
  }

  const isOwner = currentUser?.id === userId;

  // Filter based on visibility and relationship
  const visible = allPlaylists.filter(p => {
    if (isOwner) return true;
    if (!p.visibility || p.visibility === 'public') return true;
    if (p.visibility === 'friends_only') return isFollowing;
    return false;
  });

  return Response.json({ playlists: visible, isFollowing });
});