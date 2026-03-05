<script setup lang="ts">
  import { onMounted, ref, computed } from 'vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import SessionsSection from '../components/home/SessionsSection.vue';
  import SongsSection from '../components/home/SongsSection.vue';
  import CreateSessionDialog from '../components/dialogs/create-session/CreateSessionDialog.vue';
  import CreateSongDialog from '../components/dialogs/create-song/CreateSongDialog.vue';
  import { fetchLatestSessions, type Session } from '../lib/session';
  import { useAuth } from '../composables/useAuth';
  import { useRouter } from 'vue-router';
  import Routes from '../router/Routes';
  import { fetchHomeSongs, type Song } from '../lib/song';

  const isCreateDialogOpen = ref(false);
  const isCreateSongDialogOpen = ref(false);

  const openCreateDialog = () => {
    isCreateDialogOpen.value = true;
  };

  const openCreateSongDialog = () => {
    isCreateSongDialogOpen.value = true;
  };

  const { user } = useAuth();
  const router = useRouter();

  const latestSessions = ref<Session[]>([]);
  const latestSongs = ref<Song[]>([]);
  const sessionsError = ref<string | null>(null);
  const songsError = ref<string | null>(null);
  const sessionsLoading = ref(true);
  const songsLoading = ref(true);

  // Compute which section is actively loading - ensures only one shows at a time
  const loadingSection = computed(() => {
    // Show sessions loading if sessions has no data and no error, OR if songs isn't ready yet
    if (sessionsLoading.value && latestSessions.value.length === 0) {
      return 'sessions';
    }
    // Show songs loading if sessions is done and songs has no data and no error
    if (!sessionsLoading.value && songsLoading.value && latestSongs.value.length === 0) {
      return 'songs';
    }
    return null;
  });

  const displaySongs = computed<{ [key: string]: Song[] }>(() => {
    const songs = latestSongs.value;
    if (songs.length > 0) {
      const temp: { [key: string]: Song[] } = {};
      songs.forEach((song) => {
        const { artist } = song;
        if (temp[artist] == null) {
          temp[artist] = [];
        }

        temp[artist].push(song);
      });
      return temp;
    }

    return {};
  });

  // PATTERN: Extract this data fetching logic into a composable useHomeData()
  // See: https://vuejs.org/guide/reusability/composables.html
  // This will improve testability and allow reuse in other components
  onMounted(() => {
    const fetchAndSongsSessionsAsync = async () => {
      try {
        sessionsError.value = null;
        latestSessions.value = await fetchLatestSessions(user.value?.uid ?? '');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání relací';
        sessionsError.value = `Chyba při načítání relací. ${errorMessage}`;
      } finally {
        sessionsLoading.value = false;
      }

      // After sessions is done, fetch songs
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

    fetchAndSongsSessionsAsync();
  });

  const openSession = (session: Session) => {
    router.push({ path: Routes.Session, query: { sessionId: session.id } });
  };

  const goToJoinPage = () => router.push({ path: Routes.Join });
  const goToSessionListPage = () => router.push({ path: Routes.SessionList });
</script>

<template>
  <TopNavigation />

  <div
    class="container"
    data-testid="home-view"
  >
    <SessionsSection
      :latest-sessions="latestSessions"
      :sessions-error="sessionsError"
      :loading-section="loadingSection"
      :open-create-dialog="openCreateDialog"
      :go-to-join-page="goToJoinPage"
      :go-to-session-list-page="goToSessionListPage"
      :open-session="openSession"
    />

    <SongsSection
      :display-songs="displaySongs"
      :songs-error="songsError"
      :loading-section="loadingSection"
      :open-create-song-dialog="openCreateSongDialog"
    />

    <!-- Create Session Dialog -->
    <CreateSessionDialog
      :open="isCreateDialogOpen"
      @update:open="isCreateDialogOpen = $event"
    />

    <!-- Create Song Dialog -->
    <CreateSongDialog
      :open="isCreateSongDialogOpen"
      @update:open="isCreateSongDialogOpen = $event"
    />
  </div>
</template>

<style scoped>
  /* Main container */
  .container {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    padding: var(--space-xl) var(--space-md);
  }

  /* Responsive */
  @media (min-width: 768px) {
    .container {
      padding: var(--space-2xl) var(--space-xl);
    }
  }
</style>
