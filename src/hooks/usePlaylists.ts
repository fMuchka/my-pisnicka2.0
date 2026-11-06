import { useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  updatePlaylist,
  type Playlist,
  type PlaylistScope,
  type PlaylistWithSongs,
  type UpdatePlaylistInput,
} from '../lib/playlist';
import { keepPlaylistsLoaded, playlistsKey, usePlaylistsStore } from '../stores/playlists';

export type { PlaylistScope, PlaylistWithSongs };

/**
 * Playlists of the given scope, each with its songs in playlist order, kept current with
 * Firestore. The changes below need no local bookkeeping: the listener brings them back.
 */
export function usePlaylists(scope: PlaylistScope) {
  const { user } = useAuth();
  const userId = user?.uid ?? '';
  const loaded = usePlaylistsStore((state) => state.loaded[playlistsKey(scope, userId)]);

  useEffect(() => {
    if (userId) keepPlaylistsLoaded(scope, userId);
  }, [scope, userId]);

  return {
    playlists: loaded?.playlists ?? [],
    isLoading: loaded === undefined,
    error: loaded?.error ?? null,
    canEdit: (playlist: Playlist) => playlist.ownerId === userId,
    create: (input: UpdatePlaylistInput) => createPlaylist({ ...input, ownerId: userId }),
    update: async (playlistId: string, input: UpdatePlaylistInput) => {
      await updatePlaylist(playlistId, input);
    },
    remove: deletePlaylist,
    addSongs: async (playlistId: string, songIds: string[]) => {
      // One at a time: each add reads the current last position to append after it.
      for (const songId of songIds) {
        await addSongToPlaylist(playlistId, songId);
      }
    },
    removeSong: removeSongFromPlaylist,
    reorderSongs: reorderPlaylistSongs,
  };
}
