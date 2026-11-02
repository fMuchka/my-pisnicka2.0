import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  addSongToPlaylist,
  createPlaylist,
  fetchPlaylistSongRefs,
  fetchPublicPlaylists,
  fetchUserPlaylists,
  removeSongFromPlaylist,
  type Playlist,
  type PlaylistSongRef,
  type PlaylistVisibility,
} from '../../lib/playlist';
import type { PublicMode } from './types';

export type PlaylistWithSongs = Playlist & { songRefs: PlaylistSongRef[] };

type LoadedPlaylists = {
  /** Which mode and user these were loaded for, so a stale result never shows as current. */
  key: string;
  playlists: PlaylistWithSongs[];
  error: string | null;
};

const fetchPlaylists = async (mode: PublicMode, ownerId: string) => {
  const playlists =
    mode === 'private' ? await fetchUserPlaylists(ownerId) : await fetchPublicPlaylists(ownerId);

  return Promise.all(
    playlists.map(async (playlist) => ({
      ...playlist,
      songRefs: await fetchPlaylistSongRefs(playlist.id),
    }))
  );
};

/**
 * The signed-in user's own playlists ('private') or everyone else's public ones ('public'),
 * each with its songs in playlist order.
 */
export function usePlaylists(mode: PublicMode) {
  const { user } = useAuth();
  const ownerId = user?.uid ?? '';
  const key = `${mode}:${ownerId}`;
  const [loaded, setLoaded] = useState<LoadedPlaylists | null>(null);

  useEffect(() => {
    if (!ownerId) return;

    let ignore = false;

    fetchPlaylists(mode, ownerId).then(
      (playlists) => {
        if (!ignore) setLoaded({ key, playlists, error: null });
      },
      () => {
        if (!ignore) setLoaded({ key, playlists: [], error: 'Nepodařilo se načíst playlisty.' });
      }
    );

    return () => {
      ignore = true;
    };
  }, [key, mode, ownerId]);

  const current = loaded?.key === key ? loaded : null;

  // Skipped when the mode changed while the write was running: the next load brings it in.
  const updatePlaylists = (update: (playlists: PlaylistWithSongs[]) => PlaylistWithSongs[]) =>
    setLoaded((state) =>
      state?.key === key ? { ...state, playlists: update(state.playlists) } : state
    );

  const updateSongRefs = (playlistId: string, songRefs: PlaylistSongRef[]) =>
    updatePlaylists((playlists) =>
      playlists.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, songRefs } : playlist
      )
    );

  const create = async (name: string, visibility: PlaylistVisibility) => {
    const playlist = await createPlaylist({ name, ownerId, visibility });
    updatePlaylists((playlists) => [{ ...playlist, songRefs: [] }, ...playlists]);
  };

  const addSongs = async (playlistId: string, songIds: string[]) => {
    try {
      // One at a time: each add reads the current last position to append after it.
      for (const songId of songIds) {
        await addSongToPlaylist(playlistId, songId);
      }
    } finally {
      updateSongRefs(playlistId, await fetchPlaylistSongRefs(playlistId));
    }
  };

  const removeSong = async (playlistId: string, songRefId: string) => {
    await removeSongFromPlaylist(playlistId, songRefId);

    updatePlaylists((playlists) =>
      playlists.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, songRefs: playlist.songRefs.filter((ref) => ref.id !== songRefId) }
          : playlist
      )
    );
  };

  return {
    playlists: current?.playlists ?? [],
    isLoading: current === null,
    error: current?.error ?? null,
    canEdit: (playlist: Playlist) => playlist.ownerId === ownerId,
    create,
    addSongs,
    removeSong,
  };
}
