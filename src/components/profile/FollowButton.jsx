import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// status: null = not following, 'pending' = request sent, 'accepted' = following
export default function FollowButton({ currentUserId, currentUserEmail, currentUserName, targetUserId, targetUserEmail, followStatus, onStatusChange, theyFollowMe = false }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;
    setLoading(true);

    if (followStatus === 'accepted' || followStatus === 'pending') {
      // Unfollow / cancel request
      const follows = await base44.entities.Follow.filter({
        follower_id: currentUserId,
        following_id: targetUserId,
      });
      if (follows.length > 0) {
        await base44.entities.Follow.delete(follows[0].id);
      }
      onStatusChange?.(null);
    } else {
      // Send follow request (pending)
      // Fetch current user's username to store in Follow record
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.Follow.create({
        follower_id: currentUserId,
        follower_email: currentUserEmail,
        follower_name: currentUserName || '',
        follower_username: me?.username || '',
        following_id: targetUserId,
        following_email: targetUserEmail,
        status: 'pending',
      });
      onStatusChange?.('pending');
    }

    setLoading(false);
  };

  const label = followStatus === 'accepted' ? 'Seguindo' : followStatus === 'pending' ? 'Solicitado' : theyFollowMe ? 'Seguir de volta' : 'Seguir';
  const Icon = followStatus === 'accepted' ? UserCheck : followStatus === 'pending' ? Clock : UserPlus;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
        followStatus === 'accepted'
          ? 'bg-secondary text-foreground border border-border'
          : followStatus === 'pending'
          ? 'bg-secondary text-muted-foreground border border-border'
          : 'gradient-primary text-white'
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  );
}