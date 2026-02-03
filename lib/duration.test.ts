import { describe, it, expect } from 'vitest';
import { convertDaysToISO8601, isValidDuration, DURATION_OPTIONS, type TrialDuration } from './duration';

describe('duration utilities', () => {
  describe('convertDaysToISO8601', () => {
    it('should convert 7 days to ISO 8601 format', () => {
      expect(convertDaysToISO8601(7)).toBe('P0Y0M7DT0H0M0S');
    });

    it('should convert 30 days to ISO 8601 format', () => {
      expect(convertDaysToISO8601(30)).toBe('P0Y0M30DT0H0M0S');
    });

    it('should convert 60 days to ISO 8601 format', () => {
      expect(convertDaysToISO8601(60)).toBe('P0Y0M60DT0H0M0S');
    });

    it('should handle arbitrary day values (even if invalid)', () => {
      expect(convertDaysToISO8601(15)).toBe('P0Y0M15DT0H0M0S');
      expect(convertDaysToISO8601(90)).toBe('P0Y0M90DT0H0M0S');
    });
  });

  describe('isValidDuration', () => {
    it('should return true for 7 days', () => {
      expect(isValidDuration(7)).toBe(true);
    });

    it('should return true for 30 days', () => {
      expect(isValidDuration(30)).toBe(true);
    });

    it('should return true for 60 days', () => {
      expect(isValidDuration(60)).toBe(true);
    });

    it('should return false for 15 days', () => {
      expect(isValidDuration(15)).toBe(false);
    });

    it('should return false for negative values', () => {
      expect(isValidDuration(-1)).toBe(false);
    });

    it('should return false for zero', () => {
      expect(isValidDuration(0)).toBe(false);
    });

    it('should return false for other positive values', () => {
      expect(isValidDuration(1)).toBe(false);
      expect(isValidDuration(100)).toBe(false);
    });

    it('should correctly narrow TypeScript type', () => {
      const value = 30;
      if (isValidDuration(value)) {
        // TypeScript should recognize this as TrialDuration
        const duration: TrialDuration = value;
        expect(duration).toBe(30);
      }
    });
  });

  describe('DURATION_OPTIONS', () => {
    it('should contain 3 duration options', () => {
      expect(DURATION_OPTIONS).toHaveLength(3);
    });

    it('should contain 7 days option', () => {
      const option = DURATION_OPTIONS.find(opt => opt.value === 7);
      expect(option).toBeDefined();
      expect(option?.label).toBe('7 days');
    });

    it('should contain 30 days option with recommended label', () => {
      const option = DURATION_OPTIONS.find(opt => opt.value === 30);
      expect(option).toBeDefined();
      expect(option?.label).toBe('30 days (recommended)');
    });

    it('should contain 60 days option', () => {
      const option = DURATION_OPTIONS.find(opt => opt.value === 60);
      expect(option).toBeDefined();
      expect(option?.label).toBe('60 days');
    });

    it('should have options in ascending order', () => {
      expect(DURATION_OPTIONS[0].value).toBe(7);
      expect(DURATION_OPTIONS[1].value).toBe(30);
      expect(DURATION_OPTIONS[2].value).toBe(60);
    });
  });
});
