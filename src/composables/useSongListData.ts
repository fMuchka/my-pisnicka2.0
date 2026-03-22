import { ref, watch, type Ref } from 'vue';
import { fetchAllUserSongs, type Song } from '../lib/song';

export function useSongListData(ownerId: Ref<string>) {
  const userSongs = ref<Song[]>([]);

  const fetchData = async () => {
    try {
      if (ownerId.value !== '') {
        userSongs.value = await fetchAllUserSongs(ownerId.value);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  watch(
    ownerId,
    () => {
      void fetchData();
    },
    { immediate: true }
  );

  return {
    userSongs,
  };
}
