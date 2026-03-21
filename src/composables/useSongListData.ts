import { ref, onMounted } from 'vue';
import { fetchAllUserSongs, type Song } from '../lib/song';

export function useSongListData(ownerId: string) {
  const userSongs = ref<Song[]>([]);

  const fetchData = async () => {
    try {
      if (ownerId !== '') {
        userSongs.value = await fetchAllUserSongs(ownerId);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      console.log('done');
    }
  };

  onMounted(() => {
    void fetchData();
  });

  return {
    userSongs,
  };
}
