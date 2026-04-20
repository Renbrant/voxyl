import { useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const THRESHOLD = 80; // px to trigger action

export default function SwipeableEpisodeRow({ children, isFinished, onMarkFinished, onMarkUnfinished }) {
  const [offsetX, setOffsetX] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [direction, setDirection] = useState(null); // 'left' or 'right'
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = false;
    setTriggered(false);
    setDirection(null);
  };

  const onTouchMove = (e) => {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    
    isDraggingRef.current = true;
    
    if (dx < 0) {
      // Left swipe: mark as finished
      setDirection('left');
      const clamped = Math.max(dx, -THRESHOLD - 20);
      setOffsetX(clamped);
      setTriggered(Math.abs(clamped) >= THRESHOLD);
    } else if (dx > 0) {
      // Right swipe: mark as unfinished
      setDirection('right');
      const clamped = Math.min(dx, THRESHOLD + 20);
      setOffsetX(clamped);
      setTriggered(Math.abs(clamped) >= THRESHOLD);
    }
  };

  const onTouchEnd = () => {
    if (isDraggingRef.current && triggered) {
      if (direction === 'left') {
        onMarkFinished(); // Left swipe = mark as finished
      } else if (direction === 'right') {
        onMarkUnfinished(); // Right swipe = mark as unfinished
      }
    }
    setOffsetX(0);
    setTriggered(false);
    setDirection(null);
    startXRef.current = null;
    isDraggingRef.current = false;
  };

  const revealWidth = Math.abs(offsetX);
  const isLeftSwipe = direction === 'left';
  const Icon = isLeftSwipe ? CheckCircle2 : X;
  const bgColor = isLeftSwipe ? 'bg-green-600' : 'bg-red-600';
  const iconColor = 'text-white';

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Revealed action behind */}
      <div
        className={cn("absolute inset-y-0 flex items-center justify-center transition-colors", bgColor, isLeftSwipe ? 'right-0' : 'left-0')}
        style={{ width: revealWidth }}
      >
        {revealWidth > 24 && (
          <div className={cn("flex flex-col items-center gap-1", isLeftSwipe ? "pr-3" : "pl-3")}>
            <Icon size={20} className={cn(iconColor, triggered && 'scale-125 transition-transform')} />
            {revealWidth > 50 && (
              <span className="text-xs text-white font-medium whitespace-nowrap">
                {isLeftSwipe ? 'Ouvido' : 'Não ouvido'}
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