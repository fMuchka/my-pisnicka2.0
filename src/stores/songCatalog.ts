import { create } from 'zustand';
import { subscribeToSongCatalog, type Song } from '../lib/song';

type SongCatalogState = {
  /** Every song, without its text. */
  songs: Song[];
  isLoading: boolean;
  error: string | null;
};

const initialState: SongCatalogState = { songs: [], isLoading: true, error: null };

export const useSongCatalogStore = create<SongCatalogState>()(() => initialState);

let unsubscribe: (() => void) | null = null;

/**
 * Starts the one catalog listener on first use. It then stays until logout: going back to a list
 * costs no reads, and only songs that changed are read again.
 */
export function keepSongCatalogLoaded() {
  if (unsubscribe != null) return;

  unsubscribe = subscribeToSongCatalog(
    (songs) => useSongCatalogStore.setState({ songs, isLoading: false, error: null }),
    () => {
      // Lets the next screen that needs the catalog try again.
      unsubscribe = null;
      useSongCatalogStore.setState({ isLoading: false, error: 'Nepodařilo se načíst písně.' });
    }
  );
}

export function forgetSongCatalog() {
  unsubscribe?.();
  unsubscribe = null;
  useSongCatalogStore.setState(initialState);
}
