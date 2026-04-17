import { Loader2 } from 'lucide-react';

export default function PullToRefreshIndicator({ pullProgress, refreshing }) {
  const visible = refreshing || pullProgress > 0;
  if (!visible) return null;

  const size = refreshing ? 1 : pullProgress;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex justify-center z-30 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <div
        className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center transition-transform"
        style={{ transform: `scale(${size})`, opacity: size }}
      >
        <Loader2
          size={16}
          className={`text-primary ${refreshing ? 'animate-spin' : ''}`}
          style={!refreshing ? { transform: `rotate(${pullProgress * 360}deg)` } : {}}
        />
      </div>
    </div>
  );
}