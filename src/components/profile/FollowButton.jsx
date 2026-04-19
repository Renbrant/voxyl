import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FollowButton({ targetUserId, targetUserEmail, isFollowing, onFollowChange }) {
  const [loading, setLoading] = useState(false);

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const follows = await base44.entities.Follow.filter({
          follower_id: (await base44.auth.me()).id,
          following_id: targetUserId,
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
      } else {
        // Follow
        const user = await base44.auth.me();
        await base44.entities.Follow.create({
          follower_id: user.id,
          follower_email: user.email,
          following_id: targetUserId,
          following_email: targetUserEmail,
        });
      }
      onFollowChange?.(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        isFollowing
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'gradient-primary text-white'
      )}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isFollowing ? (
        <UserCheck size={12} />
      ) : (
        <UserPlus size={12} />
      )}
      {isFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  );
}