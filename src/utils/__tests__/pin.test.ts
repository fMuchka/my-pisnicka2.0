import { describe, it, expect } from 'vitest';
// TDD: module to be implemented
import { validatePin, normalizePin, pinToString } from '../pin';

describe('PIN utilities', () => {
  describe('validatePin', () => {
    it('returns true only for exactly four digits', () => {
      expect(validatePin('1234')).toBe(true);
      expect(validatePin('0007')).toBe(true);
      expect(validatePin('12 34')).toBe(false);
      expect(validatePin('123')).toBe(false);
      expect(validatePin('12345')).toBe(false);
      expect(validatePin('abcd')).toBe(false);
    });
  });

  describe('normalizePin', () => {
    it('trims whitespace and removes non-digit characters', () => {
      expect(normalizePin(' 12 34 ')).toBe('1234');
      expect(normalizePin('ab12cd34')).toBe('1234');
      expect(normalizePin('00-73')).toBe('0073');
    });

    it('preserves leading zeros', () => {
      expect(normalizePin('0073')).toBe('0073');
    });
  });

  describe('pinToString', () => {
    it('always returns a string and preserves leading zeros', () => {
      expect(pinToString(73)).toBe('73');
      expect(pinToString('0073')).toBe('0073');
    });
  });
});
