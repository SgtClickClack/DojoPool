export function throttleLocationUpdates<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        lastCall = Date.now();
        func(...lastArgs);
      }
    }, delay - (now - lastCall));
  }) as T;
}
