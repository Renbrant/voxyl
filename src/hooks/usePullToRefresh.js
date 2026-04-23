import { useRef, useEffect, useState } from 'react';

export function usePullToRefresh(onRefresh, containerRef) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullProgress, setPullProgress] = useState(0); // 0–1
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // If no containerRef provided, listen on the document (for full-page scrollable views)
    const el = containerRef?.current ?? null;
    const target = el || document;

    const THRESHOLD = 64;

    const getScrollTop = () => el ? el.scrollTop : (document.documentElement.scrollTop || document.body.scrollTop);

    const onTouchStart = (e) => {
      if (getScrollTop() === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        setPullProgress(Math.min(dy / THRESHOLD, 1));
      } else {
        pulling.current = false;
        setPullProgress(0);
      }
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

    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove', onTouchMove, { passive: true });
    target.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, containerRef]);

  return { pullProgress, refreshing };
}