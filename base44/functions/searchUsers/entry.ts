import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    let users;
    if (query && query.trim()) {
      const q = query.trim().toLowerCase().replace(/^@+/, '');
      users = await base44.asServiceRole.entities.User.list();
      users = users.filter(u => {
        if (u.id === user.id) return false;
        if (u.profile_hidden) return false;
        const uname = (u.username || '').toLowerCase().replace(/^@+/, '');
        return uname.includes(q) || u.full_name?.toLowerCase().includes(q);
      });
    } else {
      users = await base44.asServiceRole.entities.User.list();
      users = users.filter(u => u.id !== user.id && !u.profile_hidden);
    }

    // Return only safe public fields
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      profile_hidden: u.profile_hidden,
    }));

    return Response.json({ users: safeUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});