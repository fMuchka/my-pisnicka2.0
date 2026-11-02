import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  fetchPlaylistSongRefs,
  fetchPublicPlaylists,
  fetchUserPlaylists,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  updatePlaylist,
  type Playlist,
  type PlaylistSongRef,
  type UpdatePlaylistInput,
} from '../lib/playlist';

export type PlaylistWithSongs = Playlist & { songRefs: PlaylistSongRef[] };

/** The signed-in user's own playlists, or everyone else's public ones. */
export type PlaylistScope = 'mine' | 'public';

type LoadedPlaylists = {
  /** Which scope and user these were loaded for, so a stale result never shows as current. */
  key: string;
  playlists: PlaylistWithSongs[];
  error: string | null;
};

const fetchPlaylists = async (scope: PlaylistScope, ownerId: string) => {
  const playlists =
    scope === 'mine' ? await fetchUserPlaylists(ownerId) : await fetchPublicPlaylists(ownerId);

  return Promise.all(
    playlists.map(async (playlist) => ({
      ...playlist,
      songRefs: await fetchPlaylistSongRefs(playlist.id),
    }))
  );
};

/** Playlists of the given scope, each with its songs in playlist order. */
export function usePlaylists(scope: PlaylistScope) {
  const { user } = useAuth();
  const ownerId = user?.uid ?? '';
  const key = `${scope}:${ownerId}`;
  const [loaded, setLoaded] = useState<LoadedPlaylists | null>(null);

  useEffect(() => {
    if (!ownerId) return;

    let ignore = false;

    fetchPlaylists(scope, ownerId).then(
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
  }, [key, scope, ownerId]);

  const current = loaded?.key === key ? loaded : null;

  // Skipped when the scope changed while the write was running: the next load brings it in.
  const updatePlaylists = (update: (playlists: PlaylistWithSongs[]) => PlaylistWithSongs[]) =>
    setLoaded((state) =>
      state?.key === key ? { ...state, playlists: update(state.playlists) } : state
    );

  const updateOne = (
    playlistId: string,
    update: (playlist: PlaylistWithSongs) => PlaylistWithSongs
  ) =>
    updatePlaylists((playlists) =>
      playlists.map((playlist) => (playlist.id === playlistId ? update(playlist) : playlist))
    );

  const create = async (input: UpdatePlaylistInput) => {
    const playlist = await createPlaylist({ ...input, ownerId });
    updatePlaylists((playlists) => [{ ...playlist, songRefs: [] }, ...playlists]);
    return playlist;
  };

  const update = async (playlistId: string, input: UpdatePlaylistInput) => {
    const changes = await updatePlaylist(playlistId, input);
    updateOne(playlistId, (playlist) => ({ ...playlist, ...changes }));
  };

  const remove = async (playlistId: string) => {
    await deletePlaylist(playlistId);
    updatePlaylists((playlists) => playlists.filter((playlist) => playlist.id !== playlistId));
  };

  const addSongs = async (playlistId: string, songIds: string[]) => {
    try {
      // One at a time: each add reads the current last position to append after it.
      for (const songId of songIds) {
        await addSongToPlaylist(playlistId, songId);
      }
    } finally {
      const songRefs = await fetchPlaylistSongRefs(playlistId);
      updateOne(playlistId, (playlist) => ({ ...playlist, songRefs }));
    }
  };

  const removeSong = async (playlistId: string, songRefId: string) => {
    await removeSongFromPlaylist(playlistId, songRefId);
    updateOne(playlistId, (playlist) => ({
      ...playlist,
      songRefs: playlist.songRefs.filter((ref) => ref.id !== songRefId),
    }));
  };

  const reorderSongs = async (playlistId: string, orderedSongRefIds: string[]) => {
    await reorderPlaylistSongs(playlistId, orderedSongRefIds);
    updateOne(playlistId, (playlist) => {
      const refById = new Map(playlist.songRefs.map((ref) => [ref.id, ref]));
      const songRefs = orderedSongRefIds.flatMap((id, position) => {
        const ref = refById.get(id);
        return ref ? [{ ...ref, position }] : [];
      });
      return { ...playlist, songRefs };
    });
  };

  return {
    playlists: current?.playlists ?? [],
    isLoading: current === null,
    error: current?.error ?? null,
    canEdit: (playlist: Playlist) => playlist.ownerId === ownerId,
    create,
    update,
    remove,
    addSongs,
    removeSong,
    reorderSongs,
  };
}
