// Throttling utilities consolidated and cleaned
// Removed unused imports and commented code

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number },
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {},
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  let pending: { args: Parameters<T> } | null = null;

  const later = (args: Parameters<T>) => {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    func.apply(null, args);
    if (pending) {
      const pendingArgs = pending.args;
      pending = null;
      func.apply(null, pendingArgs);
    }
  };

  return function throttled(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (!previous && options.leading === false) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      return func.apply(this, args);
    }

    if (!timeout && options.trailing !== false) {
      pending = { args };
      timeout = setTimeout(() => later(args), remaining);
    }
  };
}

export function throttleLocationUpdates<
  T extends { latitude: number; longitude: number },
>(
  callback: (location: T) => void,
  minDistance = 10, // minimum distance in meters
  minTime = 1000, // minimum time in milliseconds
): (location: T) => void {
  let lastLocation: T | null = null;
  let lastUpdateTime = 0;

  return throttle(
    (location: T) => {
      const now = Date.now();

      // Always update if this is the first location
      if (!lastLocation) {
        lastLocation = location;
        lastUpdateTime = now;
        callback(location);
        return;
      }

      // Calculate distance from last update
      const distance = calculateDistance(lastLocation, location);
      const timeDiff = now - lastUpdateTime;

      // Update if either minimum distance or time has passed
      if (distance >= minDistance || timeDiff >= minTime) {
        lastLocation = location;
        lastUpdateTime = now;
        callback(location);
      }
    },
    minTime,
    { leading: true, trailing: true },
  );
}
