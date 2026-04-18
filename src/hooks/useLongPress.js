import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, delay = 3000) {
  const timerRef = useRef(null);

  const start = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    timerRef.current = setTimeout(() => {
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };
}