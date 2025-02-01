import { calculateWinRate, formatGameTime, validateScore } from '../../utils/gameUtils';

describe('gameUtils', () => {
  describe('calculateWinRate', () => {
    it('calculates win rate correctly', () => {
      expect(calculateWinRate(7, 10)).toBe(0.7);
      expect(calculateWinRate(0, 0)).toBe(0);
      expect(calculateWinRate(5, 5)).toBe(1);
    });
  });

  describe('formatGameTime', () => {
    it('formats game time correctly', () => {
      const time = new Date('2024-02-01T12:30:00');
      expect(formatGameTime(time)).toMatch(/12:30/);
    });

    it('handles invalid date', () => {
      expect(formatGameTime(null)).toBe('Invalid date');
    });
  });

  describe('validateScore', () => {
    it('validates legal scores', () => {
      expect(validateScore(8, 5)).toBe(true);
      expect(validateScore(7, 7)).toBe(false);
    });

    it('handles invalid scores', () => {
      expect(validateScore(-1, 5)).toBe(false);
      expect(validateScore(9, 9)).toBe(false);
      expect(validateScore(0, 0)).toBe(true);
    });

    it('validates win conditions', () => {
      expect(validateScore(8, 3)).toBe(true); // Valid win
      expect(validateScore(7, 8)).toBe(true); // Valid win
      expect(validateScore(9, 7)).toBe(false); // Invalid score
    });
  });
}); 