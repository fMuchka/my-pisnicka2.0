import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { PlaylistWithSongs } from '../../lib/playlist';
import { forgetPlaylists } from '../../stores/playlists';
import { usePlaylists, type PlaylistScope } from '../usePlaylists';

type Listener = {
  scope: PlaylistScope;
  userId: string;
  onChange: (playlists: PlaylistWithSongs[]) => void;
  onError: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const listeners: Listener[] = [];

const mocks = vi.hoisted(() => ({
  createPlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  addSongToPlaylist: vi.fn(),
  removeSongFromPlaylist: vi.fn(),
  reorderPlaylistSongs: vi.fn(),
}));

vi.mock('../../lib/playlist', () => ({
  ...mocks,
  subscribeToPlaylists: (
    scope: PlaylistScope,
    userId: string,
    onChange: Listener['onChange'],
    onError: Listener['onError']
  ) => {
    const unsubscribe = vi.fn();
    listeners.push({ scope, userId, onChange, onError, unsubscribe });
    return unsubscribe;
  },
}));

vi.mock('../useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

const mine: PlaylistWithSongs = {
  id: 'p1',
  name: 'Táborák',
  ownerId: 'u1',
  visibility: 'private',
  songRefs: [{ id: 'r1', sourceSongId: 'a', position: 0 }],
};
const theirs: PlaylistWithSongs = { ...mine, id: 'p2', ownerId: 'u2', visibility: 'public' };

describe('usePlaylists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forgetPlaylists();
    listeners.length = 0;
  });

  it('loads until the playlists arrive, then follows their changes', () => {
    const { result } = renderHook(() => usePlaylists('mine'));

    expect(listeners[0]).toMatchObject({ scope: 'mine', userId: 'u1' });
    expect(result.current.isLoading).toBe(true);

    act(() => listeners[0]?.onChange([mine]));
    expect(result.current.playlists).toEqual([mine]);
    expect(result.current.isLoading).toBe(false);

    act(() => listeners[0]?.onChange([]));
    expect(result.current.playlists).toEqual([]);
  });

  it('lets the user edit only their own playlists', () => {
    const { result } = renderHook(() => usePlaylists('public'));

    expect(result.current.canEdit(mine)).toBe(true);
    expect(result.current.canEdit(theirs)).toBe(false);
  });

  it('shows loading until a new scope’s playlists arrive', () => {
    const { result, rerender } = renderHook(({ scope }) => usePlaylists(scope), {
      initialProps: { scope: 'mine' as PlaylistScope },
    });
    act(() => listeners[0]?.onChange([mine]));

    rerender({ scope: 'public' });

    expect(listeners[1]?.scope).toBe('public');
    expect(result.current.isLoading).toBe(true);
  });

  it('shows a scope it already loaded at once and without reading it again', () => {
    const { result, rerender } = renderHook(({ scope }) => usePlaylists(scope), {
      initialProps: { scope: 'mine' as PlaylistScope },
    });
    act(() => listeners[0]?.onChange([mine]));
    rerender({ scope: 'public' });

    rerender({ scope: 'mine' });

    expect(listeners).toHaveLength(2);
    expect(listeners[0]?.unsubscribe).not.toHaveBeenCalled();
    expect(result.current.playlists).toEqual([mine]);
    expect(result.current.isLoading).toBe(false);
  });

  it('shares one listener that outlives the screens using it', () => {
    const first = renderHook(() => usePlaylists('mine'));
    act(() => listeners[0]?.onChange([mine]));
    first.unmount();

    const second = renderHook(() => usePlaylists('mine'));

    expect(listeners).toHaveLength(1);
    expect(second.result.current.playlists).toEqual([mine]);
  });

  it('reports a load failure and tries again on the next screen', () => {
    const { result, unmount } = renderHook(() => usePlaylists('mine'));

    act(() => listeners[0]?.onError(new Error('offline')));

    expect(result.current.error).toBe('Nepodařilo se načíst playlisty.');
    expect(result.current.isLoading).toBe(false);
    expect(listeners[0]?.unsubscribe).toHaveBeenCalled();

    unmount();
    renderHook(() => usePlaylists('mine'));

    expect(listeners).toHaveLength(2);
  });

  it('stops listening and drops the playlists when forgotten', () => {
    const { result } = renderHook(() => usePlaylists('mine'));
    act(() => listeners[0]?.onChange([mine]));

    act(() => forgetPlaylists());

    expect(listeners[0]?.unsubscribe).toHaveBeenCalled();
    expect(result.current.playlists).toEqual([]);
  });

  it('creates playlists as the signed-in user', async () => {
    const { result } = renderHook(() => usePlaylists('mine'));

    await result.current.create({ name: 'Nový', visibility: 'public' });

    expect(mocks.createPlaylist).toHaveBeenCalledWith({
      name: 'Nový',
      visibility: 'public',
      ownerId: 'u1',
    });
  });

  it('adds songs one after another', async () => {
    const order: string[] = [];
    mocks.addSongToPlaylist.mockImplementation(async (_playlistId: string, songId: string) => {
      order.push(`start ${songId}`);
      await Promise.resolve();
      order.push(`end ${songId}`);
    });
    const { result } = renderHook(() => usePlaylists('mine'));

    await result.current.addSongs('p1', ['b', 'c']);

    expect(order).toEqual(['start b', 'end b', 'start c', 'end c']);
  });
});
