import { useCallback, useRef } from 'react';

export interface TouchPosition {
  x: number;
  y: number;
}

export interface SwipeConfig {
  threshold?: number; // Minimum distance for swipe
  velocity?: number; // Minimum velocity for swipe
  restorePosition?: boolean; // Whether to restore position after swipe
}

export interface SwipeResult {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
  duration: number;
}

export const useSwipe = (
  onSwipe: (result: SwipeResult) => void,
  config: SwipeConfig = {}
) => {
  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);
  const startTime = useRef<number>(0);

  const { threshold = 50, velocity = 0.3, restorePosition = false } = config;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchEnd.current = null;
    startTime.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current || !touchEnd.current) return;

      const distanceX = touchStart.current.x - touchEnd.current.x;
      const distanceY = touchStart.current.y - touchEnd.current.y;
      const duration = Date.now() - startTime.current;

      const absDistanceX = Math.abs(distanceX);
      const absDistanceY = Math.abs(distanceY);

      // Determine swipe direction
      let direction: 'left' | 'right' | 'up' | 'down' | null = null;

      if (Math.max(absDistanceX, absDistanceY) > threshold) {
        if (absDistanceX > absDistanceY) {
          direction = distanceX > 0 ? 'left' : 'right';
        } else {
          direction = distanceY > 0 ? 'up' : 'down';
        }
      }

      // Calculate velocity (pixels per millisecond)
      const swipeDistance = Math.sqrt(
        distanceX * distanceX + distanceY * distanceY
      );
      const swipeVelocity = swipeDistance / duration;

      const result: SwipeResult = {
        direction,
        distance: Math.max(absDistanceX, absDistanceY),
        velocity: swipeVelocity,
        duration,
      };

      // Only trigger swipe if velocity meets threshold
      if (swipeVelocity >= velocity && direction) {
        onSwipe(result);
      }

      // Reset touch positions
      touchStart.current = null;
      touchEnd.current = null;
    },
    [onSwipe, threshold, velocity]
  );

  const bindSwipe = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      element.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd]
  );

  return { bindSwipe };
};

// Hook for pull-to-refresh functionality
export const usePullToRefresh = (
  onRefresh: () => void | Promise<void>,
  threshold: number = 80
) => {
  const pullStartY = useRef<number>(0);
  const pullDistance = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing.current) return;
    pullStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing.current || pullStartY.current === 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - pullStartY.current;

      // Only allow pulling down from top
      if (distance > 0 && window.scrollY === 0) {
        pullDistance.current = Math.min(distance, threshold * 2);
        e.preventDefault(); // Prevent default scrolling
      }
    },
    [threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing.current || pullDistance.current < threshold) {
      pullDistance.current = 0;
      return;
    }

    isRefreshing.current = true;
    pullDistance.current = 0;

    try {
      await onRefresh();
    } finally {
      isRefreshing.current = false;
    }
  }, [onRefresh, threshold]);

  const bindPullToRefresh = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      element.addEventListener('touchstart', handleTouchStart, {
        passive: false,
      });
      element.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd]
  );

  return {
    bindPullToRefresh,
    isRefreshing: isRefreshing.current,
    pullDistance: pullDistance.current,
  };
};

// Hook for long press detection
export const useLongPress = (
  onLongPress: () => void,
  onClick: () => void,
  delay: number = 500
) => {
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      event.preventDefault();
      target.current = event.target;

      timeout.current = setTimeout(() => {
        onLongPress();
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (
      event: React.TouchEvent | React.MouseEvent,
      shouldTriggerClick: boolean = true
    ) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (shouldTriggerClick) {
        onClick();
      }
    },
    [onClick]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
};

// Hook for tap detection with double tap support
export const useTap = (
  onTap: () => void,
  onDoubleTap: () => void,
  delay: number = 300
) => {
  const lastTap = useRef<number>(0);
  const timeout = useRef<NodeJS.Timeout>();

  const handleTap = useCallback(() => {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTap.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      // Double tap detected
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      onDoubleTap();
      lastTap.current = 0;
    } else {
      // Single tap - set timeout for potential double tap
      lastTap.current = currentTime;
      timeout.current = setTimeout(() => {
        onTap();
        lastTap.current = 0;
      }, delay);
    }
  }, [onTap, onDoubleTap, delay]);

  return {
    onClick: handleTap,
    onTouchEnd: handleTap,
  };
};

// Hook for pinch-to-zoom gesture
export const usePinch = (
  onPinch: (scale: number, center: TouchPosition) => void,
  onPinchEnd: () => void
) => {
  const initialDistance = useRef<number>(0);
  const currentScale = useRef<number>(1);

  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;

    const touch1 = touches[0];
    const touch2 = touches[1];

    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;

    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: TouchList): TouchPosition => {
    if (touches.length < 2) return { x: 0, y: 0 };

    const touch1 = touches[0];
    const touch2 = touches[1];

    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance.current = getTouchDistance(e.touches);
        currentScale.current = 1;
      }
    },
    [getTouchDistance]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current > 0) {
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / initialDistance.current;
        const center = getTouchCenter(e.touches);

        currentScale.current = scale;
        onPinch(scale, center);
      }
    },
    [getTouchDistance, getTouchCenter, onPinch]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialDistance.current = 0;
        onPinchEnd();
      }
    },
    [onPinchEnd]
  );

  const bindPinch = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      element.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd]
  );

  return { bindPinch, currentScale: currentScale.current };
};
