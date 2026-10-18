import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSongStore } from '../stores/song';
import { fetchAllSongCategories, type SongCategory } from '../lib/song';

export function useSongListData() {
  const songs = useSongStore((state) => state.songs);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [songCategories, setSongCategories] = useState<SongCategory[]>([]);

  const userSongs = useMemo(() => Array.from(songs.values()), [songs]);

  useEffect(() => {
    const fetchData = async () => {
      setIsRefreshing(true);
      try {
        const { loadSongsFromCache, fetchAllSongsIntoStore } = useSongStore.getState();
        const hadCache = await loadSongsFromCache();
        if (!hadCache) {
          await fetchAllSongsIntoStore();
        }

        setSongCategories(await fetchAllSongCategories());
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setIsRefreshing(false);
      }
    };

    void fetchData();
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await useSongStore.getState().refreshAllSongs();
      setSongCategories(await fetchAllSongCategories());
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    userSongs,
    songCategories,
    isRefreshing,
    refresh,
  };
}
