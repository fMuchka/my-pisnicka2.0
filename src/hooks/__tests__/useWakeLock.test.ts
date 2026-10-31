import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWakeLock } from '../useWakeLock';

const createSentinel = () => {
  const sentinel = {
    released: false,
    release: vi.fn(() => {
      sentinel.released = true;
      return Promise.resolve();
    }),
  };
  return sentinel;
};

let sentinels: ReturnType<typeof createSentinel>[] = [];
const request = vi.fn(() => {
  const sentinel = createSentinel();
  sentinels.push(sentinel);
  return Promise.resolve(sentinel);
});

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useWakeLock', () => {
  beforeEach(() => {
    sentinels = [];
    request.mockClear();
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    setVisibility('visible');
  });

  it('holds a screen lock only while active', async () => {
    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: false },
    });
    expect(request).not.toHaveBeenCalled();

    rerender({ active: true });
    await waitFor(() => expect(sentinels).toHaveLength(1));
    expect(request).toHaveBeenCalledWith('screen');

    rerender({ active: false });
    expect(sentinels[0]?.release).toHaveBeenCalled();
  });

  it('takes the lock again when the page comes back into view', async () => {
    renderHook(() => useWakeLock(true));
    await waitFor(() => expect(sentinels).toHaveLength(1));

    // The browser drops the lock while the page is hidden.
    if (sentinels[0]) sentinels[0].released = true;
    setVisibility('hidden');
    expect(request).toHaveBeenCalledOnce();

    setVisibility('visible');
    await waitFor(() => expect(sentinels).toHaveLength(2));
  });

  it('releases a lock that arrives after it is no longer wanted', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));
    unmount();

    await waitFor(() => expect(sentinels[0]?.release).toHaveBeenCalled());
  });

  it('does nothing where the API is missing or the request is refused', async () => {
    request.mockRejectedValueOnce(new Error('NotAllowedError'));
    const { unmount } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(request).toHaveBeenCalled());
    unmount();

    Reflect.deleteProperty(navigator, 'wakeLock');
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
