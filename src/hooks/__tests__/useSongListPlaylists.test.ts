import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Playlist, PlaylistSongRef } from '../../lib/playlist';
import type { Song } from '../../lib/song';
import { useSongListPlaylists } from '../useSongListPlaylists';

const mocks = vi.hoisted(() => ({
  fetchUserPlaylists: vi.fn(),
  fetchPublicPlaylists: vi.fn(),
  fetchPlaylistSongRefs: vi.fn(),
  createPlaylist: vi.fn(),
  addSongToPlaylist: vi.fn(),
  removeSongFromPlaylist: vi.fn(),
}));

vi.mock('../../lib/playlist', () => mocks);

const songs: Song[] = [
  { id: 'a', title: 'Alpha', artist: 'X', ownerId: 'u1' },
  { id: 'b', title: 'Beta', artist: 'X', ownerId: 'u1' },
  { id: 'c', title: 'Gamma', artist: 'X', ownerId: 'u1' },
];

const minePlaylist: Playlist = { id: 'p1', name: 'Táborák', ownerId: 'u1', visibility: 'private' };
const hostPlaylist: Playlist = { id: 'p2', name: 'Hostův', ownerId: 'h1', visibility: 'public' };
const otherPlaylist: Playlist = { id: 'p3', name: 'Cizí', ownerId: 'h2', visibility: 'public' };

const songRef = (id: string, sourceSongId: string): PlaylistSongRef => ({
  id,
  sourceSongId,
  position: 0,
});

const sortByTitle = (a: Song, b: Song) => a.title.localeCompare(b.title);

const renderPlaylists = (overrides: { sessionHostId?: string; currentUserId?: string } = {}) =>
  renderHook(() =>
    useSongListPlaylists({
      sourceMode: 'playlists',
      sessionHostId: overrides.sessionHostId ?? '',
      currentUserId: overrides.currentUserId ?? 'u1',
      userSongs: songs,
      sortSongs: sortByTitle,
    })
  );

describe('useSongListPlaylists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchUserPlaylists.mockResolvedValue([minePlaylist]);
    mocks.fetchPublicPlaylists.mockResolvedValue([hostPlaylist, otherPlaylist]);
    mocks.fetchPlaylistSongRefs.mockResolvedValue([songRef('r1', 'a')]);
  });

  it('loads the user’s playlists with their song counts', async () => {
    const { result } = renderPlaylists();

    await waitFor(() => expect(result.current.playlists).toEqual([minePlaylist]));
    expect(mocks.fetchUserPlaylists).toHaveBeenCalledWith('u1');
    expect(result.current.playlistSongCounts).toEqual({ p1: 1 });
    expect(result.current.canCreatePlaylist).toBe(true);
  });

  it('shows session guests only the host’s public playlists', async () => {
    const { result } = renderPlaylists({ sessionHostId: 'h1', currentUserId: 'guest' });

    await waitFor(() => expect(result.current.playlists).toEqual([hostPlaylist]));
    expect(result.current.playlistScope).toBe('host');
    expect(result.current.canCreatePlaylist).toBe(false);
  });

  it('splits songs into the selected playlist and the ones still available', async () => {
    const { result } = renderPlaylists();
    await waitFor(() => expect(result.current.playlists).toHaveLength(1));

    act(() => result.current.setSelectedPlaylist('p1'));

    await waitFor(() =>
      expect(result.current.selectedPlaylistSongs.map((s) => s.id)).toEqual(['a'])
    );
    expect(result.current.availableSongsForPlaylist.map((s) => s.id)).toEqual(['b', 'c']);
    expect(result.current.canEditSelectedPlaylist).toBe(true);
  });

  it('adds the checked songs to the selected playlist', async () => {
    mocks.addSongToPlaylist.mockResolvedValue(undefined);
    const { result } = renderPlaylists();
    await waitFor(() => expect(result.current.playlists).toHaveLength(1));
    act(() => result.current.setSelectedPlaylist('p1'));
    await waitFor(() => expect(result.current.selectedPlaylistSongs).toHaveLength(1));

    act(() => result.current.toggleGlobalSongSelection('b'));
    expect(result.current.canAddSongToPlaylist).toBe(true);

    mocks.fetchPlaylistSongRefs.mockResolvedValue([songRef('r1', 'a'), songRef('r2', 'b')]);
    await act(() => result.current.addSongToSelectedPlaylist());

    expect(mocks.addSongToPlaylist).toHaveBeenCalledWith('p1', 'b');
    expect(result.current.selectedPlaylistSongs.map((s) => s.id)).toEqual(['a', 'b']);
    expect(result.current.selectedGlobalSongIds).toEqual([]);
  });

  it('rejects an empty playlist name without calling Firestore', async () => {
    const { result } = renderPlaylists();
    await waitFor(() => expect(result.current.playlists).toHaveLength(1));

    await act(() => result.current.createNewPlaylist({ name: '   ', visibility: 'private' }));

    expect(mocks.createPlaylist).not.toHaveBeenCalled();
    expect(result.current.playlistError).toBe('Název playlistu nesmí být prázdný.');
  });

  it('reports a load failure', async () => {
    mocks.fetchUserPlaylists.mockRejectedValue(new Error('offline'));
    const { result } = renderPlaylists();

    await waitFor(() =>
      expect(result.current.playlistError).toBe('Nepodařilo se načíst playlisty.')
    );
    expect(result.current.playlists).toEqual([]);
  });
});
