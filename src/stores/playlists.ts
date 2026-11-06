import { create } from 'zustand';
import { subscribeToPlaylists, type PlaylistScope, type PlaylistWithSongs } from '../lib/playlist';

export type LoadedPlaylists = {
  playlists: PlaylistWithSongs[];
  error: string | null;
};

type PlaylistsState = {
  /** By scope and user, see `playlistsKey`. */
  loaded: Record<string, LoadedPlaylists>;
};

export const usePlaylistsStore = create<PlaylistsState>()(() => ({ loaded: {} }));

const listeners = new Map<string, () => void>();

export const playlistsKey = (scope: PlaylistScope, userId: string) => `${scope}:${userId}`;

/**
 * Keeps the playlists in memory with their listeners open until logout, so switching tabs and
 * coming back to the library costs no reads and still shows any change made since.
 */
export function keepPlaylistsLoaded(scope: PlaylistScope, userId: string) {
  const key = playlistsKey(scope, userId);
  if (listeners.has(key)) return;

  const setLoaded = (loaded: LoadedPlaylists) =>
    usePlaylistsStore.setState((state) => ({ loaded: { ...state.loaded, [key]: loaded } }));

  listeners.set(
    key,
    subscribeToPlaylists(
      scope,
      userId,
      (playlists) => setLoaded({ playlists, error: null }),
      () => {
        // Lets the next visit try again.
        listeners.get(key)?.();
        listeners.delete(key);
        setLoaded({ playlists: [], error: 'Nepodařilo se načíst playlisty.' });
      }
    )
  );
}

export function forgetPlaylists() {
  listeners.forEach((stop) => stop());
  listeners.clear();
  usePlaylistsStore.setState({ loaded: {} });
}
