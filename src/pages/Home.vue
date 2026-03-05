<script setup lang="ts">
  // TODO: Split this large component (478 lines) into SessionsSection.vue and SongsSection.vue
  // for better testability and maintainability. See: https://vuejs.org/guide/components/registration.html
  import { Tooltip } from '@ark-ui/vue/tooltip';
  import { Plus, UserPlus } from 'lucide-vue-next';
  import { onMounted, ref, watch, computed } from 'vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import Button from '../components/core/Button.vue';
  import ErrorMessage from '../components/core/ErrorMessage.vue';
  import LoadingSpinner from '../components/core/LoadingSpinner.vue';
  import CreateSessionDialog from '../components/dialogs/create-session/CreateSessionDialog.vue';
  import CreateSongDialog from '../components/dialogs/create-song/CreateSongDialog.vue';
  import { fetchLatestSessions, type Session } from '../lib/session';
  import { useAuth } from '../composables/useAuth';
  import { formatSessionAge } from '../lib/formatter';
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

  // PATTERN: Replace this watch → computed pattern for library best practice
  // PERF: Improves reactivity and automatic cleanup
  // See: https://vuejs.org/guide/essentials/computed.html#basic-example
  // Convert to: const displaySongs = computed(() => { /* grouping logic */ })
  const displaySongs = ref<{ [key: string]: Song[] }>({});

  watch(latestSongs, (songs) => {
    if (songs.length > 0) {
      const temp: { [key: string]: Song[] } = {};
      latestSongs.value.forEach((song) => {
        const { artist } = song;
        if (temp[artist] == null) {
          temp[artist] = [];
        }

        temp[artist].push(song);
      });

      displaySongs.value = temp;
    }
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
    <!-- Sessions Section -->
    <section
      class="content-section"
      data-testid="home-sessions-section"
    >
      <div class="section-header">
        <h2 class="section-title">Relace</h2>
        <div class="header-actions">
          <!-- Create Session Button with Tooltip -->
          <Tooltip.Root :open-delay="300">
            <Tooltip.Trigger as-child>
              <Button
                class="action-btn"
                aria-label="Vytvořit novou relaci"
                :icon="{ position: 'prepend', component: Plus }"
                type="button"
                @click="openCreateDialog"
              />
            </Tooltip.Trigger>
            <Teleport to="body">
              <Tooltip.Positioner>
                <Tooltip.Content class="tooltip-content">Vytvořit novou relaci</Tooltip.Content>
              </Tooltip.Positioner>
            </Teleport>
          </Tooltip.Root>

          <!-- Join Session Button with Tooltip -->
          <Tooltip.Root :open-delay="300">
            <Tooltip.Trigger as-child>
              <Button
                class="action-btn"
                aria-label="Připojit se k relaci"
                :icon="{ position: 'prepend', component: UserPlus }"
                @click="goToJoinPage"
              />
            </Tooltip.Trigger>
            <Teleport to="body">
              <Tooltip.Positioner>
                <Tooltip.Content class="tooltip-content">Připojit se k relaci</Tooltip.Content>
              </Tooltip.Positioner>
            </Teleport>
          </Tooltip.Root>

          <Button
            class="view-all-link"
            aria-label="Zobrazit všechny relace"
            color-variation="Primary"
            :label="'Zobrazit všechny relace'"
            @click="goToSessionListPage"
          />
        </div>
      </div>

      <!-- Loading State -->
      <LoadingSpinner
        v-if="loadingSection === 'sessions'"
        label="Načítání relací..."
      />

      <!-- Error State -->
      <ErrorMessage
        v-else-if="sessionsError"
        :message="sessionsError"
      />

      <!-- Sessions List -->
      <div
        v-else
        class="sessions-list"
        role="list"
      >
        <div
          v-if="latestSessions.length === 0"
          class="empty-state"
        >
          Žádné relace
        </div>
        <div
          v-for="session in latestSessions"
          :key="session.id"
          class="session-item"
          role="listitem"
          @click="() => openSession(session)"
        >
          <div class="session-info">
            <h3>{{ session.name }}</h3>
            <div class="session-meta">{{ formatSessionAge(session.createdAt) }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Songs Section -->
    <section
      class="content-section"
      data-testid="home-songs-section"
    >
      <div class="section-header">
        <h2 class="section-title">Písničky</h2>
        <div class="header-actions">
          <Tooltip.Root :open-delay="300">
            <Tooltip.Trigger as-child>
              <Button
                class="action-btn"
                aria-label="Vytvořit novou píseň"
                :icon="{ position: 'prepend', component: Plus }"
                type="button"
                @click="openCreateSongDialog"
              />
            </Tooltip.Trigger>
            <Teleport to="body">
              <Tooltip.Positioner>
                <Tooltip.Content class="tooltip-content">Vytvořit novou píseň</Tooltip.Content>
              </Tooltip.Positioner>
            </Teleport>
          </Tooltip.Root>
          <Button
            class="view-all-link"
            aria-label="Zobrazit všechny písně"
            color-variation="Primary"
            :label="'Zobrazit všechny písně'"
          />
        </div>
      </div>

      <!-- Loading State -->
      <LoadingSpinner
        v-if="loadingSection === 'songs'"
        label="Načítání písní..."
      />

      <!-- Error State -->
      <ErrorMessage
        v-else-if="songsError"
        :message="songsError"
      />

      <!-- Songs List -->
      <div
        v-else
        class="song-tree"
      >
        <!-- Artist Group 1 -->
        <div
          v-for="(item, key) of displaySongs"
          :key="key"
          role="list"
          class="artist-group"
        >
          <div class="artist-name">{{ key }}</div>
          <div class="songs-in-artist">
            <div
              v-for="song in item"
              :key="song.id"
              role="listitem"
              class="song-item"
            >
              {{ song.title }}
            </div>
          </div>
        </div>
      </div>
    </section>

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

  /* Content Sections */
  .content-section {
    background-color: white;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    gap: var(--space-sm);
  }

  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
  }

  .action-btn {
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-primary);
    transition: all 150ms ease;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
  }

  .action-btn:hover {
    color: var(--accent);
    background-color: var(--bg-secondary);
  }

  .view-all-link {
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 150ms ease;
  }

  .view-all-link:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  /* Sessions List */
  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    text-decoration: none;
    color: inherit;
    transition: all 150ms ease;
    cursor: pointer;
  }

  .session-item:hover {
    background-color: var(--bg-tertiary);
  }

  .session-info h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 4px 0;
  }

  .session-meta {
    font-size: 14px;
    color: var(--text-secondary);
  }

  /* Fade-out effect for preview items */
  .fade-out {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Songs Tree View */
  .song-tree {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .artist-group {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    transition: all 150ms ease;
  }

  .artist-group:hover {
    background-color: var(--bg-tertiary);
  }

  .artist-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    padding: var(--space-sm) 0;
    cursor: pointer;
    transition: opacity 150ms ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .artist-name:hover {
    opacity: 0.8;
  }

  .artist-name::before {
    content: '❯ ';
    margin-right: var(--space-xs);
  }

  .songs-in-artist {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding-left: var(--space-sm);
  }

  .song-item {
    font-size: 14px;
    color: var(--text-secondary);
    padding: var(--space-xs) 0;
    cursor: pointer;
    transition: color 150ms ease;
    text-decoration: none;
    display: block;
  }

  .song-item:hover {
    color: var(--accent);
  }

  /* Tooltip */
  .tooltip-content {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }

  /* Responsive */
  @media (min-width: 768px) {
    .container {
      padding: var(--space-2xl) var(--space-xl);
    }
  }
</style>
