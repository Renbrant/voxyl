import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FollowButton({ currentUserId, currentUserEmail, targetUserId, targetUserEmail, isFollowing, onFollowChange }) {
  const [loading, setLoading] = useState(false);

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;
    setLoading(true);

    if (isFollowing) {
      const follows = await base44.entities.Follow.filter({
        follower_id: currentUserId,
        following_id: targetUserId,
      });
      if (follows.length > 0) {
        await base44.entities.Follow.delete(follows[0].id);
      }
    } else {
      await base44.entities.Follow.create({
        follower_id: currentUserId,
        follower_email: currentUserEmail,
        following_id: targetUserId,
        following_email: targetUserEmail,
      });
    }

    onFollowChange?.(!isFollowing);
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
        isFollowing
          ? 'bg-secondary text-foreground border border-border'
          : 'gradient-primary text-white'
      )}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isFollowing ? (
        <UserCheck size={14} />
      ) : (
        <UserPlus size={14} />
      )}
      {isFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  );
}