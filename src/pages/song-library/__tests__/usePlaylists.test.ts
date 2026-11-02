import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Playlist, PlaylistSongRef } from '../../../lib/playlist';
import { usePlaylists } from '../usePlaylists';

const mocks = vi.hoisted(() => ({
  fetchUserPlaylists: vi.fn(),
  fetchPublicPlaylists: vi.fn(),
  fetchPlaylistSongRefs: vi.fn(),
  createPlaylist: vi.fn(),
  addSongToPlaylist: vi.fn(),
  removeSongFromPlaylist: vi.fn(),
}));

vi.mock('../../../lib/playlist', () => mocks);

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

const mine: Playlist = { id: 'p1', name: 'Táborák', ownerId: 'u1', visibility: 'private' };
const theirs: Playlist = { id: 'p2', name: 'Cizí', ownerId: 'u2', visibility: 'public' };

const songRef = (id: string, sourceSongId: string, position = 0): PlaylistSongRef => ({
  id,
  sourceSongId,
  position,
});

describe('usePlaylists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchUserPlaylists.mockResolvedValue([mine]);
    mocks.fetchPublicPlaylists.mockResolvedValue([theirs]);
    mocks.fetchPlaylistSongRefs.mockResolvedValue([songRef('r1', 'a')]);
  });

  it('loads the user’s own playlists with their songs', async () => {
    const { result } = renderHook(() => usePlaylists('private'));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mocks.fetchUserPlaylists).toHaveBeenCalledWith('u1');
    expect(result.current.playlists).toEqual([{ ...mine, songRefs: [songRef('r1', 'a')] }]);
    expect(result.current.canEdit(mine)).toBe(true);
  });

  it('loads other people’s public playlists, which the user cannot edit', async () => {
    const { result } = renderHook(() => usePlaylists('public'));

    await waitFor(() => expect(result.current.playlists).toHaveLength(1));

    expect(mocks.fetchPublicPlaylists).toHaveBeenCalledWith('u1');
    expect(result.current.playlists[0]?.id).toBe('p2');
    expect(result.current.canEdit(theirs)).toBe(false);
  });

  it('shows loading again until the playlists of the new mode arrive', async () => {
    const { result, rerender } = renderHook(({ mode }) => usePlaylists(mode), {
      initialProps: { mode: 'private' as const } as { mode: 'private' | 'public' },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ mode: 'public' });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.playlists[0]?.id).toBe('p2'));
  });

  it('puts a new playlist first', async () => {
    const created: Playlist = { id: 'p9', name: 'Nový', ownerId: 'u1', visibility: 'public' };
    mocks.createPlaylist.mockResolvedValue(created);
    const { result } = renderHook(() => usePlaylists('private'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.create('Nový', 'public'));

    expect(mocks.createPlaylist).toHaveBeenCalledWith({
      name: 'Nový',
      ownerId: 'u1',
      visibility: 'public',
    });
    expect(result.current.playlists.map((playlist) => playlist.id)).toEqual(['p9', 'p1']);
  });

  it('adds songs one after another, then reloads the playlist’s songs', async () => {
    const order: string[] = [];
    mocks.addSongToPlaylist.mockImplementation(async (_playlistId: string, songId: string) => {
      order.push(`start ${songId}`);
      await Promise.resolve();
      order.push(`end ${songId}`);
    });
    const { result } = renderHook(() => usePlaylists('private'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const afterAdd = [songRef('r1', 'a'), songRef('r2', 'b', 1), songRef('r3', 'c', 2)];
    mocks.fetchPlaylistSongRefs.mockResolvedValue(afterAdd);
    await act(() => result.current.addSongs('p1', ['b', 'c']));

    expect(order).toEqual(['start b', 'end b', 'start c', 'end c']);
    expect(result.current.playlists[0]?.songRefs).toEqual(afterAdd);
  });

  it('drops a removed song from its playlist', async () => {
    const { result } = renderHook(() => usePlaylists('private'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.removeSong('p1', 'r1'));

    expect(mocks.removeSongFromPlaylist).toHaveBeenCalledWith('p1', 'r1');
    expect(result.current.playlists[0]?.songRefs).toEqual([]);
  });

  it('reports a load failure', async () => {
    mocks.fetchUserPlaylists.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => usePlaylists('private'));

    await waitFor(() => expect(result.current.error).toBe('Nepodařilo se načíst playlisty.'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlists).toEqual([]);
  });
});
