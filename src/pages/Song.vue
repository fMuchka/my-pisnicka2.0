<script setup lang="ts">
  import { Pencil } from 'lucide-vue-next';
  import { computed, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import PageHeader from '../components/PageHeader.vue';
  import Button from '../components/core/Button.vue';
  import CreateSongDialog from '../components/dialogs/create-song/CreateSongDialog.vue';
  import ErrorMessage from '../components/core/ErrorMessage.vue';
  import LoadingSpinner from '../components/core/LoadingSpinner.vue';
  import SongChordOverview from '../components/song/SongChordOverview.vue';
  import ChordLayoutRenderer from '../components/song/ChordLayoutRenderer.vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import { useAuth } from '../composables/useAuth';
  import { useSongDetail } from '../composables/useSongDetail';
  import type { Song } from '../lib/song';

  type SectionType = 'intro' | 'verse' | 'chorus' | 'outro';
  type Section = { type: SectionType; text: string };

  const route = useRoute();
  const { isAuthenticated } = useAuth();
  const isEditDialogOpen = ref(false);

  const songId = computed(() => {
    const routeSongId = route.params.songId;

    if (typeof routeSongId === 'string') {
      return routeSongId;
    }

    return null;
  });

  const { song, songError, songLoading } = useSongDetail(songId);

  const songText = computed(() => song.value?.text?.trim() || 'Text písně zatím není k dispozici.');
  const songChords = computed(() => song.value?.chords?.filter((chord) => chord.length > 0) ?? []);
  const sectionLabels: Record<SectionType, string> = {
    intro: 'Intro',
    verse: 'Verse',
    chorus: 'Chorus',
    outro: 'Outro',
  };

  const sections = ref<Section[]>([]);

  const SECTION_MARKER_REGEX = /\[(intro|verse|chorus|outro)\]/gi;

  watch(
    songText,
    (newValue) => {
      const normalizedText = newValue.trim();

      if (!normalizedText) {
        sections.value = [];

        return;
      }

      const markers = [...normalizedText.matchAll(SECTION_MARKER_REGEX)];

      if (markers.length === 0) {
        sections.value = [];

        return;
      }

      const newSections: Section[] = [];

      for (let i = 0; i < markers.length; i += 1) {
        const marker = markers[i];

        if (!marker || marker.index === undefined) {
          continue;
        }

        const sectionType = marker[1]?.toLowerCase() as SectionType | undefined;
        const sectionTextStart = marker.index + marker[0].length;
        const nextMarker = markers[i + 1];
        const sectionTextEnd = nextMarker?.index ?? normalizedText.length;
        const sectionText = normalizedText.slice(sectionTextStart, sectionTextEnd).trim();

        if (sectionType && sectionText.length > 0) {
          newSections.push({
            type: sectionType,
            text: sectionText,
          });
        }
      }

      sections.value = newSections;
    },
    { immediate: true }
  );

  const openEditSongDialog = () => {
    isEditDialogOpen.value = true;
  };

  const handleSongSaved = (updatedSong: Song) => {
    song.value = updatedSong;
  };
</script>

<template>
  <TopNavigation :page-title="song?.title ?? 'Píseň'" />

  <main class="song-page">
    <div class="song-shell">
      <div class="song-quick-nav">
        <Button
          v-if="isAuthenticated && song"
          class="edit-button"
          label="Upravit píseň"
          color-variation="Primary"
          style-variation="Outlined"
          :icon="{ position: 'prepend', component: Pencil }"
          type="button"
          @click="openEditSongDialog"
        />
      </div>

      <LoadingSpinner
        v-if="songLoading"
        label="Načítání písně..."
      />

      <ErrorMessage
        v-else-if="songError"
        :message="songError"
      />

      <section
        v-else-if="song"
        class="song-content"
      >
        <PageHeader
          :title="song.title"
          :tagline="song.artist"
        />

        <SongChordOverview
          v-if="songChords.length > 0"
          :chords="songChords"
        />

        <article class="song-body">
          <template v-if="sections.length > 0">
            <section
              v-for="(section, index) in sections"
              :key="`${section.type}-${index}`"
              class="song-section"
              :class="`song-section--${section.type}`"
            >
              <h2 class="song-section-title">{{ sectionLabels[section.type] }}</h2>
              <ChordLayoutRenderer
                class="song-text"
                :text="section.text"
              />
            </section>
          </template>
          <ChordLayoutRenderer
            v-else
            class="song-text"
            :text="songText"
          />
        </article>
      </section>

      <section
        v-else
        class="song-empty-state"
      >
        <h1 class="song-empty-title">Píseň nebyla nalezena</h1>
        <p class="song-empty-text">Zkontrolujte odkaz nebo se vraťte na přehled písní.</p>
      </section>
    </div>

    <CreateSongDialog
      :open="isEditDialogOpen"
      :song-to-edit="song"
      @update:open="isEditDialogOpen = $event"
      @saved="handleSongSaved"
    />
  </main>
</template>

<style scoped>
  .song-page {
    min-height: 100vh;
    background:
      radial-gradient(
        circle at top,
        color-mix(in srgb, var(--accent) 6%, transparent),
        transparent 35%
      ),
      var(--bg-primary);
    color: var(--text-primary);
  }

  .song-shell {
    width: min(100%, 760px);
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md) var(--space-3xl);
  }

  .edit-button {
    margin-bottom: var(--space-lg);
  }

  .song-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .song-body {
    --song-anchored-line-height: 4;
    --song-chord-font-size: 1rem;
    --song-text-line-height: 6;
    --song-text-font-family: monospace;
    --song-text-font-size: 1rem;
    --song-chord-inline-color: var(--text-chord);
    --song-chord-inline-bg: color-mix(in srgb, var(--accent) 18%, white);
    --song-chord-inline-font-size: inherit;
    --song-chord-inline-font-family: inherit;
    --song-chord-inline-font-weight: inherit;
    --song-chord-inline-radius: 3px;
    overflow-x: auto;
  }

  .song-quick-nav {
    display: flex;
    justify-content: space-between;
  }

  .song-section {
    --section-accent: color-mix(in srgb, var(--accent) 35%, transparent);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--section-accent) 45%, transparent);
    border-left-width: 4px;
    background: color-mix(in srgb, var(--section-accent) 12%, var(--bg-primary));
  }

  .song-section:not(:last-child) {
    margin-bottom: var(--space-md);
  }

  .song-section--intro {
    --section-accent: color-mix(in srgb, #f59e0b 55%, var(--accent));
  }

  .song-section--verse {
    --section-accent: color-mix(in srgb, #16a34a 42%, var(--accent));
  }

  .song-section--chorus {
    --section-accent: color-mix(in srgb, #0284c7 45%, var(--accent));
  }

  .song-section--outro {
    --section-accent: color-mix(in srgb, #dc2626 35%, var(--accent));
  }

  .song-section-title {
    margin: 0 0 var(--space-sm);
    font-size: 13px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .song-text {
    --song-text-color: var(--text-chord);
    margin: 0;
    font-family: var(--song-text-font-family);
    font-size: var(--song-text-font-size);
    line-height: var(--song-text-line-height);
  }

  .song-empty-state {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-xl) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
  }

  .song-empty-title {
    font-size: 24px;
    font-weight: 600;
  }

  .song-empty-text {
    color: var(--text-secondary);
    font-size: 16px;
    line-height: 1.6;
  }
</style>
