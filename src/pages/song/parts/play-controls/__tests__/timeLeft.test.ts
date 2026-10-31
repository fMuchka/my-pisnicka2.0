import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { formatTimeLeft, useTimeLeftVisible } from '../timeLeft';

describe('formatTimeLeft', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTimeLeft(0)).toBe('0:00');
    expect(formatTimeLeft(9)).toBe('0:09');
    expect(formatTimeLeft(80)).toBe('1:20');
    expect(formatTimeLeft(725)).toBe('12:05');
  });
});

describe('useTimeLeftVisible', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('is visible until the user hides it', () => {
    const { result } = renderHook(() => useTimeLeftVisible());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem('my-pisnicka:play-time-left-visible')).toBe('false');
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useTimeLeftVisible());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });
});
