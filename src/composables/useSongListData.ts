import { ref } from 'vue';
import { fetchAllSongs, type Song } from '../lib/song';

export function useSongListData() {
  const userSongs = ref<Song[]>([]);

  const fetchData = async () => {
    try {
      userSongs.value = await fetchAllSongs();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  void fetchData();

  return {
    userSongs,
  };
}
