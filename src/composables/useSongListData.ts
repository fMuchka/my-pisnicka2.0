import { computed, ref } from 'vue';
import { useSongStore } from '../stores/song';
import { fetchAllSongCategories, type SongCategory } from '../lib/song';

export function useSongListData() {
  const songStore = useSongStore();
  const isRefreshing = ref(false);
  const songCategories = ref<SongCategory[]>([]);

  const userSongs = computed(() => Array.from(songStore.songs.values()));

  const fetchData = async () => {
    isRefreshing.value = true;
    try {
      const hadCache = await songStore.loadSongsFromCache();
      if (!hadCache) {
        await songStore.fetchAllSongsIntoStore();
      }

      songCategories.value = await fetchAllSongCategories();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      isRefreshing.value = false;
    }
  };

  const refresh = async () => {
    isRefreshing.value = true;
    try {
      await songStore.refreshAllSongs();
      songCategories.value = await fetchAllSongCategories();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      isRefreshing.value = false;
    }
  };

  void fetchData();

  return {
    userSongs,
    songCategories,
    isRefreshing,
    refresh,
  };
}
