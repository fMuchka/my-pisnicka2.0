import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { formatSessionAge } from '../formatter';

describe('formatSessionAge', () => {
  beforeEach(() => {
    // Set current time to a fixed date for consistency
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats less than 1 hour', () => {
    const now = new Date();
    const timestamp = Timestamp.fromDate(new Date(now.getTime() - 30 * 60 * 1000)); // 30 min ago
    expect(formatSessionAge(timestamp)).toBe('před méně než 1 hodinou');
  });

  it('formats exactly 1 hour', () => {
    const now = new Date();
    const timestamp = Timestamp.fromDate(new Date(now.getTime() - 1 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp)).toBe('před 1 hodinou');
  });

  it('formats 2-23 hours with "hodinami"', () => {
    const now = new Date();

    const timestamp2h = Timestamp.fromDate(new Date(now.getTime() - 2 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp2h)).toBe('před 2 hodinami');

    const timestamp5h = Timestamp.fromDate(new Date(now.getTime() - 5 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp5h)).toBe('před 5 hodinami');

    const timestamp23h = Timestamp.fromDate(new Date(now.getTime() - 23 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp23h)).toBe('před 23 hodinami');
  });

  it('formats 1 day', () => {
    const now = new Date();
    const timestamp = Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp)).toBe('před 1 dnem');
  });

  it('formats 2-6 days with "dny"', () => {
    const now = new Date();

    const timestamp2d = Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp2d)).toBe('před 2 dny');

    const timestamp6d = Timestamp.fromDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp6d)).toBe('před 6 dny');
  });

  it('formats 7-13 days as "před týdnem"', () => {
    const now = new Date();

    const timestamp7d = Timestamp.fromDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp7d)).toBe('před týdnem');

    const timestamp13d = Timestamp.fromDate(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp13d)).toBe('před týdnem');
  });

  it('formats 14-29 days with weeks "týdny"', () => {
    const now = new Date();

    const timestamp14d = Timestamp.fromDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp14d)).toBe('před 2 týdny');

    const timestamp21d = Timestamp.fromDate(new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp21d)).toBe('před 3 týdny');
  });

  it('formats 30-59 days as "před měsícem"', () => {
    const now = new Date();

    const timestamp30d = Timestamp.fromDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp30d)).toBe('před měsícem');

    const timestamp45d = Timestamp.fromDate(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp45d)).toBe('před měsícem');
  });

  it('formats 2-11 months with "měsíci"', () => {
    const now = new Date();

    const timestamp2m = Timestamp.fromDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp2m)).toBe('před 2 měsíci');

    const timestamp6m = Timestamp.fromDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp6m)).toBe('před 6 měsíci');
  });

  it('formats 12+ months as "před více než rokem"', () => {
    const now = new Date();

    const timestamp1y = Timestamp.fromDate(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp1y)).toBe('před více než rokem');

    const timestamp2y = Timestamp.fromDate(new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000));
    expect(formatSessionAge(timestamp2y)).toBe('před více než rokem');
  });
});
