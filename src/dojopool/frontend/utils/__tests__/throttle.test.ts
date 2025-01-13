import { throttle, throttleLocationUpdates } from '../throttle';

describe('throttle utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('throttle', () => {
    it('executes function immediately by default', () => {
      const func = jest.fn();
      const throttled = throttle(func, 1000);

      throttled();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('limits execution frequency', () => {
      const func = jest.fn();
      const throttled = throttle(func, 1000);

      throttled();
      throttled();
      throttled();

      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('executes with latest arguments', () => {
      const func = jest.fn();
      const throttled = throttle(func, 1000);

      throttled(1);
      throttled(2);
      throttled(3);

      expect(func).toHaveBeenCalledWith(1);

      jest.advanceTimersByTime(1000);
      expect(func).toHaveBeenCalledWith(3);
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('respects leading option', () => {
      const func = jest.fn();
      const throttled = throttle(func, 1000, { leading: false });

      throttled();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('respects trailing option', () => {
      const func = jest.fn();
      const throttled = throttle(func, 1000, { trailing: false });

      throttled();
      throttled();
      throttled();

      jest.advanceTimersByTime(1000);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttleLocationUpdates', () => {
    const mockLocation = { latitude: 51.5074, longitude: -0.1278 };

    it('executes immediately for first location', () => {
      const callback = jest.fn();
      const throttled = throttleLocationUpdates(callback);

      throttled(mockLocation);
      expect(callback).toHaveBeenCalledWith(mockLocation);
    });

    it('throttles based on time', () => {
      const callback = jest.fn();
      const throttled = throttleLocationUpdates(callback, 10, 1000);

      throttled(mockLocation);
      throttled(mockLocation);
      throttled(mockLocation);

      expect(callback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('throttles based on distance', () => {
      const callback = jest.fn();
      const throttled = throttleLocationUpdates(callback, 10, 1000);

      // Initial location
      throttled(mockLocation);
      expect(callback).toHaveBeenCalledTimes(1);

      // Very close location (< 10m)
      throttled({
        latitude: mockLocation.latitude + 0.0000001,
        longitude: mockLocation.longitude + 0.0000001,
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // Far location (> 10m)
      throttled({
        latitude: mockLocation.latitude + 0.001,
        longitude: mockLocation.longitude + 0.001,
      });
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('updates after minimum time even if distance is small', () => {
      const callback = jest.fn();
      const throttled = throttleLocationUpdates(callback, 10, 1000);

      throttled(mockLocation);
      expect(callback).toHaveBeenCalledTimes(1);

      // Very close location
      const nearbyLocation = {
        latitude: mockLocation.latitude + 0.0000001,
        longitude: mockLocation.longitude + 0.0000001,
      };
      throttled(nearbyLocation);
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time past threshold
      jest.advanceTimersByTime(1000);
      throttled(nearbyLocation);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('handles edge cases', () => {
      const callback = jest.fn();
      const throttled = throttleLocationUpdates(callback, 0, 0);

      throttled(mockLocation);
      throttled(mockLocation);

      // Should still throttle to prevent excessive updates
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
