import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AUTO_SCROLL_SPEED, useAutoScroll } from '../useAutoScroll';

let frames: FrameRequestCallback[] = [];
const runFrame = (time: number) => {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((callback) => callback(time)));
};

const scrollTo = vi.fn();

const sectionAt = (top: number) => {
  const section = document.createElement('section');
  section.getBoundingClientRect = () => ({ top }) as DOMRect;
  section.scrollIntoView = vi.fn();
  return section;
};

const sheetWith = (...sections: HTMLElement[]) => {
  const sheet = document.createElement('div');
  sheet.append(...sections);
  return { current: sheet };
};

describe('useAutoScroll', () => {
  beforeEach(() => {
    frames = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      frames = [];
    });
    vi.spyOn(performance, 'now').mockReturnValue(0);
    window.scrollTo = scrollTo as typeof window.scrollTo;
    scrollTo.mockClear();
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 5000,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts play mode paused and scrolls at the current speed once started', () => {
    const { result } = renderHook(() => useAutoScroll(true, { current: null }));
    expect(result.current.isScrolling).toBe(false);
    expect(frames).toHaveLength(0);

    act(() => result.current.toggleScrolling());
    expect(result.current.isScrolling).toBe(true);
    runFrame(1000);
    runFrame(2000);

    expect(scrollTo).toHaveBeenLastCalledWith(0, AUTO_SCROLL_SPEED.default);

    act(() => result.current.toggleScrolling());
    expect(frames).toHaveLength(0);
  });

  it('never scrolls outside play mode', () => {
    const { result } = renderHook(() => useAutoScroll(false, { current: null }));

    act(() => result.current.toggleScrolling());

    expect(result.current.isScrolling).toBe(false);
    expect(frames).toHaveLength(0);
  });

  it('is paused again on the next visit to play mode', () => {
    const { result, rerender } = renderHook(
      ({ playMode }) => useAutoScroll(playMode, { current: null }),
      { initialProps: { playMode: true } }
    );
    act(() => result.current.toggleScrolling());

    rerender({ playMode: false });
    rerender({ playMode: true });

    expect(result.current.isScrolling).toBe(false);
  });

  it('pauses at the end of the song', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: window.innerHeight + 10,
      configurable: true,
    });
    const { result } = renderHook(() => useAutoScroll(true, { current: null }));

    act(() => result.current.toggleScrolling());
    runFrame(0);
    runFrame(1000);

    expect(scrollTo).toHaveBeenLastCalledWith(0, 10);
    expect(result.current.isScrolling).toBe(false);
  });

  it('works out the seconds left from the distance to the end and the speed', () => {
    const { result } = renderHook(() => useAutoScroll(true, { current: null }));
    const distance = 5000 - window.innerHeight;

    expect(result.current.secondsLeft).toBe(Math.ceil(distance / AUTO_SCROLL_SPEED.default));

    act(() => result.current.speedUp());
    expect(result.current.secondsLeft).toBe(
      Math.ceil(distance / (AUTO_SCROLL_SPEED.default + AUTO_SCROLL_SPEED.step))
    );
  });

  it('changes the speed within its limits', () => {
    const { result } = renderHook(() => useAutoScroll(false, { current: null }));

    act(() => result.current.speedUp());
    expect(result.current.speed).toBe(AUTO_SCROLL_SPEED.default + AUTO_SCROLL_SPEED.step);

    for (let i = 0; i < 30; i++) act(() => result.current.speedUp());
    expect(result.current.speed).toBe(AUTO_SCROLL_SPEED.max);
    expect(result.current.canSpeedUp).toBe(false);

    for (let i = 0; i < 30; i++) act(() => result.current.slowDown());
    expect(result.current.speed).toBe(AUTO_SCROLL_SPEED.min);
    expect(result.current.canSlowDown).toBe(false);
  });

  it('jumps to the next and the previous section', () => {
    const above = sectionAt(-300);
    const current = sectionAt(0);
    const below = sectionAt(400);
    const { result } = renderHook(() => useAutoScroll(false, sheetWith(above, current, below)));

    act(() => result.current.jump('forward'));
    expect(below.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    act(() => result.current.jump('back'));
    expect(above.scrollIntoView).toHaveBeenCalled();
    expect(current.scrollIntoView).not.toHaveBeenCalled();
  });

  it('goes to the very top or bottom when there is no section that way', () => {
    const { result } = renderHook(() => useAutoScroll(false, sheetWith(sectionAt(0))));

    act(() => result.current.jump('back'));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });

    act(() => result.current.jump('forward'));
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 5000 - window.innerHeight,
      behavior: 'smooth',
    });
  });

  it('holds the auto-scroll while a jump is under way', () => {
    const { result } = renderHook(() => useAutoScroll(true, sheetWith(sectionAt(400))));
    act(() => result.current.toggleScrolling());
    runFrame(0);

    act(() => result.current.jump('forward'));
    scrollTo.mockClear();
    runFrame(500);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  describe('manual scrolling', () => {
    const scrollGesture = (type: 'wheel' | 'touchmove') => {
      const event = new Event(type, { cancelable: true });
      window.dispatchEvent(event);
      return event;
    };

    it('is left alone by default', () => {
      const { result } = renderHook(() => useAutoScroll(true, { current: null }));
      act(() => result.current.toggleScrolling());

      expect(scrollGesture('wheel').defaultPrevented).toBe(false);
      expect(scrollGesture('touchmove').defaultPrevented).toBe(false);
    });

    it('is blocked only while auto-scrolling when not allowed', () => {
      const { result } = renderHook(() =>
        useAutoScroll(true, { current: null }, { allowManualScroll: false })
      );
      expect(scrollGesture('wheel').defaultPrevented).toBe(false);

      act(() => result.current.toggleScrolling());
      expect(scrollGesture('wheel').defaultPrevented).toBe(true);
      expect(scrollGesture('touchmove').defaultPrevented).toBe(true);

      act(() => result.current.toggleScrolling());
      expect(scrollGesture('wheel').defaultPrevented).toBe(false);
    });
  });
});
