import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Playlist, PlaylistSongRef } from '../../lib/playlist';
import { usePlaylists, type PlaylistScope } from '../usePlaylists';

const mocks = vi.hoisted(() => ({
  fetchUserPlaylists: vi.fn(),
  fetchPublicPlaylists: vi.fn(),
  fetchPlaylistSongRefs: vi.fn(),
  createPlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  addSongToPlaylist: vi.fn(),
  removeSongFromPlaylist: vi.fn(),
  reorderPlaylistSongs: vi.fn(),
}));

vi.mock('../../lib/playlist', () => mocks);

vi.mock('../useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

const mine: Playlist = { id: 'p1', name: 'Táborák', ownerId: 'u1', visibility: 'private' };
const theirs: Playlist = { id: 'p2', name: 'Cizí', ownerId: 'u2', visibility: 'public' };

const songRef = (id: string, sourceSongId: string, position = 0): PlaylistSongRef => ({
  id,
  sourceSongId,
  position,
});

const renderLoaded = async (scope: PlaylistScope = 'mine') => {
  const rendered = renderHook(() => usePlaylists(scope));
  await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
  return rendered;
};

describe('usePlaylists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchUserPlaylists.mockResolvedValue([mine]);
    mocks.fetchPublicPlaylists.mockResolvedValue([theirs]);
    mocks.fetchPlaylistSongRefs.mockResolvedValue([songRef('r1', 'a')]);
  });

  it('loads the user’s own playlists with their songs', async () => {
    const { result } = renderHook(() => usePlaylists('mine'));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mocks.fetchUserPlaylists).toHaveBeenCalledWith('u1');
    expect(result.current.playlists).toEqual([{ ...mine, songRefs: [songRef('r1', 'a')] }]);
    expect(result.current.canEdit(mine)).toBe(true);
  });

  it('loads other people’s public playlists, which the user cannot edit', async () => {
    const { result } = await renderLoaded('public');

    expect(mocks.fetchPublicPlaylists).toHaveBeenCalledWith('u1');
    expect(result.current.playlists[0]?.id).toBe('p2');
    expect(result.current.canEdit(theirs)).toBe(false);
  });

  it('shows loading again until the playlists of the new scope arrive', async () => {
    const { result, rerender } = renderHook(({ scope }) => usePlaylists(scope), {
      initialProps: { scope: 'mine' as PlaylistScope },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ scope: 'public' });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.playlists[0]?.id).toBe('p2'));
  });

  it('puts a new playlist first', async () => {
    const created: Playlist = { id: 'p9', name: 'Nový', ownerId: 'u1', visibility: 'public' };
    mocks.createPlaylist.mockResolvedValue(created);
    const { result } = await renderLoaded();

    await act(() => result.current.create({ name: 'Nový', visibility: 'public' }));

    expect(mocks.createPlaylist).toHaveBeenCalledWith({
      name: 'Nový',
      ownerId: 'u1',
      visibility: 'public',
    });
    expect(result.current.playlists.map((playlist) => playlist.id)).toEqual(['p9', 'p1']);
  });

  it('renames a playlist and changes who can see it', async () => {
    mocks.updatePlaylist.mockResolvedValue({ name: 'Chata', visibility: 'public' });
    const { result } = await renderLoaded();

    await act(() => result.current.update('p1', { name: ' Chata ', visibility: 'public' }));

    expect(mocks.updatePlaylist).toHaveBeenCalledWith('p1', {
      name: ' Chata ',
      visibility: 'public',
    });
    expect(result.current.playlists[0]).toMatchObject({ name: 'Chata', visibility: 'public' });
  });

  it('drops a deleted playlist', async () => {
    const { result } = await renderLoaded();

    await act(() => result.current.remove('p1'));

    expect(mocks.deletePlaylist).toHaveBeenCalledWith('p1');
    expect(result.current.playlists).toEqual([]);
  });

  it('adds songs one after another, then reloads the playlist’s songs', async () => {
    const order: string[] = [];
    mocks.addSongToPlaylist.mockImplementation(async (_playlistId: string, songId: string) => {
      order.push(`start ${songId}`);
      await Promise.resolve();
      order.push(`end ${songId}`);
    });
    const { result } = await renderLoaded();

    const afterAdd = [songRef('r1', 'a'), songRef('r2', 'b', 1), songRef('r3', 'c', 2)];
    mocks.fetchPlaylistSongRefs.mockResolvedValue(afterAdd);
    await act(() => result.current.addSongs('p1', ['b', 'c']));

    expect(order).toEqual(['start b', 'end b', 'start c', 'end c']);
    expect(result.current.playlists[0]?.songRefs).toEqual(afterAdd);
  });

  it('drops a removed song from its playlist', async () => {
    const { result } = await renderLoaded();

    await act(() => result.current.removeSong('p1', 'r1'));

    expect(mocks.removeSongFromPlaylist).toHaveBeenCalledWith('p1', 'r1');
    expect(result.current.playlists[0]?.songRefs).toEqual([]);
  });

  it('puts the songs in their new order', async () => {
    mocks.fetchPlaylistSongRefs.mockResolvedValue([
      songRef('r1', 'a', 0),
      songRef('r2', 'b', 1),
      songRef('r3', 'c', 2),
    ]);
    const { result } = await renderLoaded();

    await act(() => result.current.reorderSongs('p1', ['r3', 'r1', 'r2']));

    expect(mocks.reorderPlaylistSongs).toHaveBeenCalledWith('p1', ['r3', 'r1', 'r2']);
    expect(result.current.playlists[0]?.songRefs).toEqual([
      songRef('r3', 'c', 0),
      songRef('r1', 'a', 1),
      songRef('r2', 'b', 2),
    ]);
  });

  it('reports a load failure', async () => {
    mocks.fetchUserPlaylists.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => usePlaylists('mine'));

    await waitFor(() => expect(result.current.error).toBe('Nepodařilo se načíst playlisty.'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlists).toEqual([]);
  });
});
