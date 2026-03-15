import { ref, watch, type Ref } from 'vue';
import { fetchSongById, type Song } from '../lib/song';

export function useSongDetail(songId: Ref<string | null>) {
  const song = ref<Song | null>(null);
  const songError = ref<string | null>(null);
  const songLoading = ref(true);

  const loadSong = async (currentSongId: string | null) => {
    if (currentSongId == null || currentSongId.length === 0) {
      song.value = null;
      songError.value = null;
      songLoading.value = false;
      return;
    }

    songLoading.value = true;

    try {
      songError.value = null;
      song.value = await fetchSongById(currentSongId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání písně';
      songError.value = `Chyba při načítání písně. ${errorMessage}`;
      song.value = null;
    } finally {
      songLoading.value = false;
    }
  };

  watch(
    songId,
    (currentSongId) => {
      void loadSong(currentSongId);
    },
    { immediate: true }
  );

  return {
    song,
    songError,
    songLoading,
  };
}
