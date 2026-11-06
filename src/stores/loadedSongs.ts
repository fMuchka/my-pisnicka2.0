import { create } from 'zustand';
import { subscribeToSong, type Song } from '../lib/song';

export type LoadedSong = {
  /** null when the song does not exist or could not be loaded. */
  song: Song | null;
  songError: string | null;
};

type LoadedSongsState = {
  songs: Record<string, LoadedSong>;
};

// Each song holds two listeners, and Firestore advises against keeping many open.
export const MAX_LOADED_SONGS = 20;

export const useLoadedSongsStore = create<LoadedSongsState>()(() => ({ songs: {} }));

// In order of use, oldest first.
const listeners = new Map<string, () => void>();

const setSong = (songId: string, loaded: LoadedSong) =>
  useLoadedSongsStore.setState((state) => ({ songs: { ...state.songs, [songId]: loaded } }));

const forgetSong = (songId: string) => {
  listeners.get(songId)?.();
  listeners.delete(songId);
  useLoadedSongsStore.setState((state) => {
    const { [songId]: _forgotten, ...songs } = state.songs;
    return { songs };
  });
};

/**
 * Keeps the song in memory with its listener open, so coming back to it costs no reads and still
 * shows any change made since. Only the most recently opened songs are kept.
 */
export function keepSongLoaded(songId: string) {
  const stop = listeners.get(songId);

  if (stop) {
    listeners.delete(songId);
    listeners.set(songId, stop);
    return;
  }

  listeners.set(
    songId,
    subscribeToSong(
      songId,
      (song) => setSong(songId, { song, songError: null }),
      (error) => {
        // Lets the next visit try again.
        listeners.get(songId)?.();
        listeners.delete(songId);
        setSong(songId, { song: null, songError: `Chyba při načítání písně. ${error.message}` });
      }
    )
  );

  if (listeners.size > MAX_LOADED_SONGS) {
    const [oldestSongId] = listeners.keys();
    if (oldestSongId !== undefined) forgetSong(oldestSongId);
  }
}

export function forgetLoadedSongs() {
  listeners.forEach((stop) => stop());
  listeners.clear();
  useLoadedSongsStore.setState({ songs: {} });
}
