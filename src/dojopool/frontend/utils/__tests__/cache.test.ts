import { Cache } from '../cache';

describe('Cache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('stores and retrieves values', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('returns undefined for non-existent keys', () => {
      const cache = new Cache<string>();
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('correctly reports size', () => {
      const cache = new Cache<string>();
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
    });

    it('clears all entries', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('Expiration', () => {
    it('expires entries after maxAge', () => {
      const cache = new Cache<string>({ maxAge: 1000 }); // 1 second
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(1500); // Advance past maxAge

      expect(cache.get('key1')).toBeUndefined();
    });

    it('cleans expired entries when setting new ones', () => {
      const cache = new Cache<string>({ maxAge: 1000 });
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      jest.advanceTimersByTime(1500);

      cache.set('key3', 'value3'); // Should trigger cleanup
      expect(cache.size()).toBe(1);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('Size Limits', () => {
    it('respects maxSize limit', () => {
      const cache = new Cache<string>({ maxSize: 2 });
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Should evict oldest entry

      expect(cache.size()).toBe(2);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('removes oldest entries when full', () => {
      const cache = new Cache<string>({ maxSize: 3 });

      // Fill cache
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Add new entry
      cache.set('key4', 'value4');

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('Complex Values', () => {
    it('handles objects correctly', () => {
      const cache = new Cache<{ x: number; y: number }>();
      const point = { x: 1, y: 2 };

      cache.set('point', point);
      const retrieved = cache.get('point');

      expect(retrieved).toEqual(point);
    });

    it('handles arrays correctly', () => {
      const cache = new Cache<number[]>();
      const numbers = [1, 2, 3];

      cache.set('numbers', numbers);
      const retrieved = cache.get('numbers');

      expect(retrieved).toEqual(numbers);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero maxAge', () => {
      const cache = new Cache<string>({ maxAge: 0 });
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBeUndefined();
    });

    it('handles zero maxSize', () => {
      const cache = new Cache<string>({ maxSize: 0 });
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(0);
    });

    it('handles undefined values', () => {
      const cache = new Cache<string | undefined>();
      cache.set('key1', undefined);
      expect(cache.get('key1')).toBeUndefined();
    });
  });
});
