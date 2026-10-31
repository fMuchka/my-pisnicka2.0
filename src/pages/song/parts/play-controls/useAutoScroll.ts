import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';

/** Pixels per second. */
export const AUTO_SCROLL_SPEED = { default: 28, min: 10, max: 80, step: 4 } as const;

// Long enough for a smooth section jump to finish before auto-scroll takes over again.
const JUMP_PAUSE_MS = 700;

export type JumpDirection = 'back' | 'forward';

const maxScrollTop = () => document.documentElement.scrollHeight - window.innerHeight;

const remainingDistance = () => Math.max(0, maxScrollTop() - window.scrollY);

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);

  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
};

// Distance from the section's scroll target, so a section that sits right under the sticky controls counts as "here".
const distanceFromTarget = (section: Element) =>
  section.getBoundingClientRect().top -
  (Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0);

/**
 * Auto-scroll for play mode: starts paused, scrolls the page down at an adjustable speed once started
 * and pauses at the end. Also jumps between the `<section>`s inside `sectionsRef`.
 * With `allowManualScroll` off, the user can't scroll by hand while it runs.
 */
export function useAutoScroll(
  isPlayMode: boolean,
  sectionsRef: RefObject<HTMLElement | null>,
  { allowManualScroll = true }: { allowManualScroll?: boolean } = {}
) {
  const [speed, setSpeed] = useState<number>(AUTO_SCROLL_SPEED.default);
  const [isScrolling, setIsScrolling] = useState(false);
  const pausedUntil = useRef(0);

  // Every visit to play mode starts paused.
  const [wasPlayMode, setWasPlayMode] = useState(isPlayMode);
  if (wasPlayMode !== isPlayMode) {
    setWasPlayMode(isPlayMode);
    setIsScrolling(false);
  }

  const isRunning = isPlayMode && isScrolling;

  // Whole seconds, so scrolling re-renders the page once a second rather than every frame.
  const secondsLeft = useSyncExternalStore(
    subscribeToScroll,
    () => Math.ceil(remainingDistance() / speed),
    () => 0
  );

  useEffect(() => {
    if (!isRunning) return;

    let frame = 0;
    let lastTime: number | null = null;
    // Kept as a float: scrollY rounds, and adding a fraction of a pixel to it each frame would never move.
    let position = window.scrollY;

    const step = (now: number) => {
      if (lastTime == null || now < pausedUntil.current) {
        position = window.scrollY;
      } else {
        // The page moved on its own (the user scrolled), so carry on from there.
        if (Math.abs(window.scrollY - position) > 1) position = window.scrollY;

        const maxTop = maxScrollTop();
        position = Math.min(position + (speed * (now - lastTime)) / 1000, maxTop);
        window.scrollTo(0, position);

        if (position >= maxTop) {
          setIsScrolling(false);
          return;
        }
      }

      lastTime = now;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isRunning, speed]);

  // Swallows wheel and touch scrolling while it runs. Keyboard scrolling stays: blocking Space or
  // the arrows on the whole page would also block them on the controls.
  useEffect(() => {
    if (!isRunning || allowManualScroll) return;

    const preventScroll = (event: Event) => event.preventDefault();
    // Not passive, or preventDefault() is ignored.
    const options = { passive: false } as const;

    window.addEventListener('wheel', preventScroll, options);
    window.addEventListener('touchmove', preventScroll, options);

    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [isRunning, allowManualScroll]);

  const toggleScrolling = useCallback(() => setIsScrolling((value) => !value), []);

  const speedUp = useCallback(
    () => setSpeed((value) => Math.min(value + AUTO_SCROLL_SPEED.step, AUTO_SCROLL_SPEED.max)),
    []
  );

  const slowDown = useCallback(
    () => setSpeed((value) => Math.max(value - AUTO_SCROLL_SPEED.step, AUTO_SCROLL_SPEED.min)),
    []
  );

  const jump = useCallback(
    (direction: JumpDirection) => {
      const sections = [...(sectionsRef.current?.querySelectorAll('section') ?? [])];
      const target =
        direction === 'forward'
          ? sections.find((section) => distanceFromTarget(section) > 1)
          : sections.reverse().find((section) => distanceFromTarget(section) < -1);

      pausedUntil.current = performance.now() + JUMP_PAUSE_MS;

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // Nothing further that way: go to the very top or bottom.
      window.scrollTo({ top: direction === 'forward' ? maxScrollTop() : 0, behavior: 'smooth' });
    },
    [sectionsRef]
  );

  return {
    speed,
    isScrolling: isRunning,
    secondsLeft,
    canSpeedUp: speed < AUTO_SCROLL_SPEED.max,
    canSlowDown: speed > AUTO_SCROLL_SPEED.min,
    toggleScrolling,
    speedUp,
    slowDown,
    jump,
  };
}
