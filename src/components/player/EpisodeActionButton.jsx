import { useState, useRef, useCallback } from 'react';
import { Play, Pause, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/lib/PlayerContext';

export default function EpisodeActionButton({ ep, isActive, isCurrentlyPlaying, isFinished, onShortPress, onMarkFinished, onMarkUnfinished }) {
  const { isLoading } = usePlayer();
  const isBuffering = isActive && isLoading;
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef(null);
  const didLongPress = useRef(false);

  const startPress = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      setPressing(false);
      if (isFinished) {
        onMarkUnfinished();
      } else {
        onMarkFinished();
      }
    }, 3000);
  }, [isFinished, onMarkFinished, onMarkUnfinished]);

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  }, []);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (didLongPress.current) return;
    onShortPress();
  }, [onShortPress]);

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 relative overflow-hidden cursor-pointer select-none",
        isActive ? "gradient-primary" : "bg-secondary"
      )}
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
    >
      {/* Fill animation on long press */}
      {pressing && (
        <div
          className="absolute inset-0 rounded-full bg-white/20 origin-bottom"
          style={{ animation: 'grow-up 3s linear forwards' }}
        />
      )}
      {isFinished
        ? <CheckCircle2 size={16} className="text-green-400 relative z-10" />
        : isBuffering
        ? <Loader2 size={14} className="text-white relative z-10 animate-spin" />
        : isCurrentlyPlaying
        ? <Pause size={12} fill="white" className="text-white relative z-10" />
        : <Play size={12} fill={isActive ? "white" : "currentColor"} className={cn("relative z-10 ml-0.5", isActive ? "text-white" : "text-muted-foreground")} />
      }

      <style>{`
        @keyframes grow-up {
          from { clip-path: inset(100% 0 0 0); }
          to   { clip-path: inset(0% 0 0 0); }
        }
      `}</style>
    </div>
  );
}