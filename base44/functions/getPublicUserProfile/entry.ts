import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { userId } = await req.json();

  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
  const user = users.find(u => u.id === userId);

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  return Response.json({
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    profile_picture: user.profile_picture || user.picture || null,
    profile_hidden: user.profile_hidden || false,
  });
});