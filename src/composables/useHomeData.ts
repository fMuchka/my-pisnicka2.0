import { computed, onMounted, ref, type Ref } from 'vue';
import { fetchLatestSessions, type Session } from '../lib/session';
import { fetchHomeSongs, type Song } from '../lib/song';
import type { User } from 'firebase/auth';

export function useHomeData(user: Ref<User | null>) {
  const latestSessions = ref<Session[]>([]);
  const latestSongs = ref<Song[]>([]);
  const sessionsError = ref<string | null>(null);
  const songsError = ref<string | null>(null);
  const sessionsLoading = ref(true);
  const songsLoading = ref(true);

  const loadingSection = computed<'sessions' | 'songs' | null>(() => {
    if (sessionsLoading.value && latestSessions.value.length === 0) {
      return 'sessions';
    }

    if (!sessionsLoading.value && songsLoading.value && latestSongs.value.length === 0) {
      return 'songs';
    }

    return null;
  });

  const displaySongs = computed<Record<string, Song[]>>(() => {
    if (latestSongs.value.length === 0) {
      return {};
    }

    return latestSongs.value.reduce<Record<string, Song[]>>((songsByArtist, song) => {
      const songsForArtist = songsByArtist[song.artist];
      if (songsForArtist == null) {
        songsByArtist[song.artist] = [song];
      } else {
        songsForArtist.push(song);
      }

      return songsByArtist;
    }, {});
  });

  const fetchData = async () => {
    try {
      sessionsError.value = null;
      latestSessions.value = await fetchLatestSessions(user.value?.uid ?? '');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání relací';
      sessionsError.value = `Chyba při načítání relací. ${errorMessage}`;
    } finally {
      sessionsLoading.value = false;
    }

    // Songs are fetched after sessions to keep loading order consistent in UI.
    try {
      songsError.value = null;
      latestSongs.value = await fetchHomeSongs();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání písní';
      songsError.value = `Chyba při načítání písní. ${errorMessage}`;
    } finally {
      songsLoading.value = false;
    }
  };

  onMounted(() => {
    void fetchData();
  });

  return {
    latestSessions,
    sessionsError,
    songsError,
    loadingSection,
    displaySongs,
    fetchData,
  };
}
