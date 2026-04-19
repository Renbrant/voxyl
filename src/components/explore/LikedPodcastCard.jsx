import { Mic, Heart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LikedPodcastCard({ podcastLike, onUnlike }) {
  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-card border border-border items-center">
      {podcastLike.podcast_image ? (
        <img
          src={podcastLike.podcast_image}
          alt={podcastLike.podcast_title}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-secondary"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-secondary flex items-center justify-center">
          <Mic size={20} className="text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{podcastLike.podcast_title}</p>
        {podcastLike.podcast_author && (
          <p className="text-xs text-primary truncate mt-0.5">{podcastLike.podcast_author}</p>
        )}
        {podcastLike.podcast_description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{podcastLike.podcast_description}</p>
        )}
      </div>

      <button
        onClick={onUnlike}
        className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
      >
        <Heart size={15} fill="currentColor" />
      </button>
    </div>
  );
}