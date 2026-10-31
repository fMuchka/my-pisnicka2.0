import { useEffect } from 'react';

/** Keeps the screen awake while `active`, where the browser supports the Screen Wake Lock API. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');

        if (cancelled) {
          void next.release();
          return;
        }

        sentinel = next;
      } catch {
        // Refused, e.g. in battery saver mode: the screen may just go to sleep as usual.
      }
    };

    // The browser drops the lock whenever the page is hidden, so take it again on the way back.
    const requestWhenVisible = () => {
      if (document.visibilityState === 'visible' && (sentinel == null || sentinel.released)) {
        void request();
      }
    };

    void request();
    document.addEventListener('visibilitychange', requestWhenVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', requestWhenVisible);
      void sentinel?.release();
    };
  }, [active]);
}
