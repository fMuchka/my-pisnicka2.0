import { ref, onMounted } from 'vue';
import { fetchAllUserSongs, type Song } from '../lib/song';

export function useSongListData(ownerId: string) {
  const userSongs = ref<Song[]>([]);
  // NOTE: This composable performs a one-time fetch on mount and does not react to `ownerId` changes.
  // PATTERN: Watch `ownerId` (or accept `Ref<string>`) when the same component can switch owners.
  // See: https://vuejs.org/guide/reusability/composables.html

  const fetchData = async () => {
    try {
      if (ownerId !== '') {
        userSongs.value = await fetchAllUserSongs(ownerId);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      // FIXME: Remove debug logging or guard with dev-only checks to reduce production noise.
      // See: https://vite.dev/guide/env-and-mode.html#env-variables-and-modes
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
