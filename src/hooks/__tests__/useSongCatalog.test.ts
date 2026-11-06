import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSongCatalog } from '../useSongCatalog';
import type { Song } from '../../lib/song';
import { forgetSongCatalog } from '../../stores/songCatalog';

type Listener = {
  onChange: (songs: Song[]) => void;
  onError: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const listeners: Listener[] = [];

vi.mock('../../lib/song', () => ({
  subscribeToSongCatalog: (onChange: Listener['onChange'], onError: Listener['onError']) => {
    const unsubscribe = vi.fn();
    listeners.push({ onChange, onError, unsubscribe });
    return unsubscribe;
  },
}));

const song: Song = { id: 's1', title: 'Kometa', artist: 'Nohavica', ownerId: 'u1' };

describe('useSongCatalog', () => {
  beforeEach(() => {
    forgetSongCatalog();
    listeners.length = 0;
  });

  it('loads until the songs arrive, then follows their changes', () => {
    const { result } = renderHook(() => useSongCatalog());
    expect(result.current).toEqual({ songs: [], isLoading: true, error: null });

    act(() => listeners[0]?.onChange([song]));
    expect(result.current).toEqual({ songs: [song], isLoading: false, error: null });

    act(() => listeners[0]?.onChange([]));
    expect(result.current.songs).toEqual([]);
  });

  it('shares one listener that outlives the screens using it', () => {
    const first = renderHook(() => useSongCatalog());
    act(() => listeners[0]?.onChange([song]));
    first.unmount();

    const second = renderHook(() => useSongCatalog());

    expect(listeners).toHaveLength(1);
    expect(listeners[0]?.unsubscribe).not.toHaveBeenCalled();
    expect(second.result.current.songs).toEqual([song]);
  });

  it('reports a failed load and tries again on the next screen', () => {
    const first = renderHook(() => useSongCatalog());

    act(() => listeners[0]?.onError(new Error('offline')));
    expect(first.result.current.error).toBe('Nepodařilo se načíst písně.');
    first.unmount();

    renderHook(() => useSongCatalog());

    expect(listeners).toHaveLength(2);
  });

  it('stops listening and drops the songs when forgotten', () => {
    const { result } = renderHook(() => useSongCatalog());
    act(() => listeners[0]?.onChange([song]));

    act(() => forgetSongCatalog());

    expect(listeners[0]?.unsubscribe).toHaveBeenCalled();
    expect(result.current).toEqual({ songs: [], isLoading: true, error: null });
  });
});
