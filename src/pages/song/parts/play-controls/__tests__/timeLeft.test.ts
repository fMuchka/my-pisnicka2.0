import { describe, expect, it } from 'vitest';
import { formatTimeLeft } from '../timeLeft';

describe('formatTimeLeft', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTimeLeft(0)).toBe('0:00');
    expect(formatTimeLeft(9)).toBe('0:09');
    expect(formatTimeLeft(80)).toBe('1:20');
    expect(formatTimeLeft(725)).toBe('12:05');
  });
});
