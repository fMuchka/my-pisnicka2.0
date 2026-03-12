<script setup lang="ts">
  import { ref } from 'vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import SessionsSection from '../components/home/SessionsSection.vue';
  import SongsSection from '../components/home/SongsSection.vue';
  import CreateSessionDialog from '../components/dialogs/create-session/CreateSessionDialog.vue';
  import CreateSongDialog from '../components/dialogs/create-song/CreateSongDialog.vue';
  import { type Session } from '../lib/session';
  import { type Song } from '../lib/song';
  import { useAuth } from '../composables/useAuth';
  import { useRouter } from 'vue-router';
  import Routes from '../router/Routes';
  import { useHomeData } from '../composables/useHomeData';

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

  const { latestSessions, sessionsError, songsError, loadingSection, displaySongs } =
    useHomeData(user);

  const openSession = (session: Session) => {
    router.push({ path: Routes.Session, query: { sessionId: session.id } });
  };

  const openSong = (song: Song) => {
    router.push({ path: Routes.Song.replace(':songId', song.id) });
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
      :open-song="openSong"
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
