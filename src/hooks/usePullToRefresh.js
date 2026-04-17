import { useRef, useEffect, useState } from 'react';

export function usePullToRefresh(onRefresh, containerRef) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullProgress, setPullProgress] = useState(0); // 0–1
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const THRESHOLD = 64;

    const onTouchStart = (e) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) setPullProgress(Math.min(dy / THRESHOLD, 1));
    };

    const onTouchEnd = (e) => {
      if (!pulling.current) return;
      const dy = e.changedTouches[0].clientY - startY.current;
      pulling.current = false;
      setPullProgress(0);
      if (dy > THRESHOLD) {
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => setRefreshing(false));
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, containerRef]);

  return { pullProgress, refreshing };
}