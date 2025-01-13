import { calculateDistance, isWithinRange, formatTime } from '../location';

describe('location utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const point1 = { latitude: 51.5074, longitude: -0.1278 }; // London
      const point2 = { latitude: 48.8566, longitude: 2.3522 }; // Paris
      const distance = calculateDistance(point1, point2);
      // Approximate distance between London and Paris is 344 km
      expect(Math.round(distance / 1000)).toBe(344);
    });

    it('should return 0 for same points', () => {
      const point = { latitude: 51.5074, longitude: -0.1278 };
      expect(calculateDistance(point, point)).toBe(0);
    });
  });

  describe('isWithinRange', () => {
    it('should return true when points are within range', () => {
      const point1 = { latitude: 51.5074, longitude: -0.1278 };
      const point2 = { latitude: 51.5074, longitude: -0.1279 }; // Very close
      expect(isWithinRange(point1, point2, 100)).toBe(true);
    });

    it('should return false when points are outside range', () => {
      const point1 = { latitude: 51.5074, longitude: -0.1278 }; // London
      const point2 = { latitude: 48.8566, longitude: 2.3522 }; // Paris
      expect(isWithinRange(point1, point2, 1000)).toBe(false);
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(formatTime(3600)).toBe('1h 0m');
      expect(formatTime(5400)).toBe('1h 30m');
      expect(formatTime(7200)).toBe('2h 0m');
      expect(formatTime(0)).toBe('0h 0m');
    });

    it('should handle edge cases', () => {
      expect(formatTime(-1)).toBe('0h 0m');
      expect(formatTime(359999)).toBe('99h 59m');
    });
  });
});
