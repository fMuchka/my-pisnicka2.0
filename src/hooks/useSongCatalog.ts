import { useEffect } from 'react';
import { keepSongCatalogLoaded, useSongCatalogStore } from '../stores/songCatalog';

/** Every song in the app (without texts), kept current with Firestore. */
export function useSongCatalog() {
  useEffect(keepSongCatalogLoaded, []);

  const songs = useSongCatalogStore((state) => state.songs);
  const isLoading = useSongCatalogStore((state) => state.isLoading);
  const error = useSongCatalogStore((state) => state.error);

  return { songs, isLoading, error };
}
