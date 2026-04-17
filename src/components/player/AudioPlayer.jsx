import { usePlayer } from '@/lib/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { formatDuration } from '@/lib/rssUtils';
import { cn } from '@/lib/utils';

export default function AudioPlayer() {
  const { currentEpisode, isPlaying, currentTime, duration, togglePlay, seek, playNext, playPrev } = usePlayer();

  if (!currentEpisode) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-3 animate-slide-up select-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}
    >
      <div className="glass border border-border rounded-2xl p-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
            {currentEpisode.image ? (
              <img src={currentEpisode.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{currentEpisode.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentEpisode.feedTitle}</p>
            <div className="mt-1.5 relative h-1 bg-border rounded-full cursor-pointer"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - rect.left) / rect.width) * duration);
              }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full gradient-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-xs text-muted-foreground">{formatDuration(Math.floor(currentTime))}</span>
              <span className="text-xs text-muted-foreground">{formatDuration(Math.floor(duration))}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={playPrev} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack size={16} />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center glow-primary transition-transform active:scale-95"
            >
              {isPlaying ? <Pause size={16} fill="white" className="text-white" /> : <Play size={16} fill="white" className="text-white ml-0.5" />}
            </button>
            <button onClick={playNext} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}