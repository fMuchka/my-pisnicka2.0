import { computed, ref } from 'vue';
import { useSongStore } from '../stores/song';

export function useSongListData() {
  const songStore = useSongStore();
  const isRefreshing = ref(false);

  const userSongs = computed(() => Array.from(songStore.songs.values()));

  const fetchData = async () => {
    isRefreshing.value = true;
    try {
      const hadCache = await songStore.loadSongsFromCache();
      if (!hadCache) {
        await songStore.fetchAllSongsIntoStore();
      }
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
    } catch (err: unknown) {
      console.error(err);
    } finally {
      isRefreshing.value = false;
    }
  };

  void fetchData();

  return {
    userSongs,
    isRefreshing,
    refresh,
  };
}
