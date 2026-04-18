import { useRef, useState } from 'react';
import { CheckCircle2, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const THRESHOLD = 80; // px to trigger action

export default function SwipeableEpisodeRow({ children, isFinished, onMarkFinished, onMarkUnfinished }) {
  const [offsetX, setOffsetX] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = false;
    setTriggered(false);
  };

  const onTouchMove = (e) => {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    if (dx > 0) return; // only left swipe
    isDraggingRef.current = true;
    const clamped = Math.max(dx, -THRESHOLD - 20);
    setOffsetX(clamped);
    setTriggered(Math.abs(clamped) >= THRESHOLD);
  };

  const onTouchEnd = () => {
    if (isDraggingRef.current && triggered) {
      if (isFinished) {
        onMarkUnfinished();
      } else {
        onMarkFinished();
      }
    }
    setOffsetX(0);
    setTriggered(false);
    startXRef.current = null;
    isDraggingRef.current = false;
  };

  const revealWidth = Math.abs(offsetX);
  const Icon = isFinished ? MinusCircle : CheckCircle2;
  const bgColor = isFinished ? 'bg-muted-foreground/30' : 'bg-green-600';
  const iconColor = isFinished ? 'text-white' : 'text-white';

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Revealed action behind */}
      <div
        className={cn("absolute inset-y-0 right-0 flex items-center justify-center transition-colors", bgColor)}
        style={{ width: revealWidth }}
      >
        {revealWidth > 24 && (
          <div className="flex flex-col items-center gap-1 pr-3">
            <Icon size={20} className={cn(iconColor, triggered && 'scale-125 transition-transform')} />
            {revealWidth > 50 && (
              <span className="text-xs text-white font-medium whitespace-nowrap">
                {isFinished ? 'Desmarcar' : 'Ouvido'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sliding content */}
      <div
        style={{ transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? 'transform 0.25s ease' : 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}