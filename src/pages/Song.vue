<script setup lang="ts">
  import { Pencil } from 'lucide-vue-next';
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import Button from '../components/core/Button.vue';
  import CreateSongDialog from '../components/dialogs/create-song/CreateSongDialog.vue';
  import ErrorMessage from '../components/core/ErrorMessage.vue';
  import LoadingSpinner from '../components/core/LoadingSpinner.vue';
  import SongChordsDialog from '../components/dialogs/song-chords/SongChordsDialog.vue';
  import SongQuickInfo from '../components/song/SongQuickInfo.vue';
  import ChordLayoutRenderer from '../components/song/ChordLayoutRenderer.vue';
  import SongControls from '../components/song/SongControls.vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import { useAuth } from '../composables/useAuth';
  import { useSongDetail } from '../composables/useSongDetail';
  import { SECTIONS_DICTIONARY, type SectionTypes } from '../lib/sections/sectionsDictionary';
  import type { Song } from '../lib/song';
  import { updateActiveSongId } from '../lib/session';
  import { useSessionStore } from '../stores/session';

  type SectionType = SectionTypes;
  type Section = { type: SectionType; text: string };

  const route = useRoute();
  const sessionStore = useSessionStore();
  const { isAuthenticated } = useAuth();
  const isEditDialogOpen = ref(false);
  const isChordsDialogOpen = ref(false);
  const transpose = ref(0);

  const isAutoScrollPlaying = ref(false);
  const autoScrollSpeed = ref(28);
  const songPageRef = ref<HTMLElement | null>(null);
  const currentScrollTop = ref(0);
  const maxScrollTop = ref(0);

  const AUTO_SCROLL_SPEED_STEP = 2;
  const AUTO_SCROLL_MIN_SPEED = 10;
  const AUTO_SCROLL_MAX_SPEED = 80;
  const AUTO_SCROLL_SCROLL_STEP = 132;
  type ScrollMode = 'auto' | 'smooth';

  let animationFrameId: number | null = null;
  let previousFrameTime: number | null = null;
  let autoScrollPosition: number | null = null;

  const isElementScrollable = (element: HTMLElement) => {
    const overflowY = window.getComputedStyle(element).overflowY;
    const allowsScrolling =
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';

    return allowsScrolling && element.scrollHeight - element.clientHeight > 1;
  };

  const getScrollableContainer = () => {
    let current = songPageRef.value;

    while (current) {
      if (isElementScrollable(current)) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  };

  const getDocumentScrollHeight = () => {
    const doc = document.documentElement;
    const body = document.body;

    return Math.max(
      doc.scrollHeight,
      body.scrollHeight,
      doc.offsetHeight,
      body.offsetHeight,
      doc.clientHeight,
      body.clientHeight
    );
  };

  const getViewportHeight = () => window.visualViewport?.height ?? window.innerHeight;

  const getCurrentScrollTop = () => {
    const container = getScrollableContainer();

    if (container) {
      return container.scrollTop;
    }

    const doc = document.documentElement;
    const body = document.body;

    return window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
  };

  const getMaxScrollTop = () => {
    const container = getScrollableContainer();

    if (container) {
      return Math.max(0, container.scrollHeight - container.clientHeight);
    }

    return Math.max(0, getDocumentScrollHeight() - getViewportHeight());
  };

  const syncScrollMetrics = () => {
    currentScrollTop.value = getCurrentScrollTop();
    maxScrollTop.value = getMaxScrollTop();
  };

  const scrollToTop = (top: number, behavior: ScrollMode = 'auto') => {
    const container = getScrollableContainer();

    if (container) {
      try {
        container.scrollTo({ top, behavior });
      } catch {
        container.scrollTop = top;
      }

      if (Math.abs(container.scrollTop - top) > 1) {
        container.scrollTop = top;
      }

      syncScrollMetrics();

      return;
    }

    const doc = document.documentElement;
    const body = document.body;

    try {
      window.scrollTo({ top, behavior });
    } catch {
      window.scrollTo(0, top);
    }

    if (Math.abs(getCurrentScrollTop() - top) > 1) {
      doc.scrollTop = top;
      body.scrollTop = top;
    }

    syncScrollMetrics();
  };

  const scrollByDistance = (distance: number, behavior: ScrollMode = 'auto') => {
    const nextTop = Math.max(0, Math.min(getCurrentScrollTop() + distance, getMaxScrollTop()));
    const shouldUseInstantScroll = isAutoScrollPlaying.value;

    scrollToTop(nextTop, shouldUseInstantScroll ? 'auto' : behavior);

    if (shouldUseInstantScroll) {
      autoScrollPosition = nextTop;
      previousFrameTime = null;
    }
  };

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
  const remainingScrollDistance = computed(() =>
    Math.max(0, maxScrollTop.value - currentScrollTop.value)
  );
  const remainingScrollSeconds = computed(() => {
    if (autoScrollSpeed.value <= 0) {
      return 0;
    }

    return Math.ceil(remainingScrollDistance.value / autoScrollSpeed.value);
  });
  const formatRemainingTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const autoScrollEtaLabel = computed(() => formatRemainingTime(remainingScrollSeconds.value));

  const sections = ref<Section[]>([]);

  const SECTION_MARKER_REGEX = new RegExp(
    `\\[(${Object.keys(SECTIONS_DICTIONARY).join('|')})\\]`,
    'gi'
  );

  const isSectionType = (value: string): value is SectionType => value in SECTIONS_DICTIONARY;

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

        const sectionTypeCandidate = marker[1]?.toLowerCase();
        const sectionTextStart = marker.index + marker[0].length;
        const nextMarker = markers[i + 1];
        const sectionTextEnd = nextMarker?.index ?? normalizedText.length;
        const sectionText = normalizedText.slice(sectionTextStart, sectionTextEnd).trim();

        if (sectionTypeCandidate && isSectionType(sectionTypeCandidate) && sectionText.length > 0) {
          newSections.push({
            type: sectionTypeCandidate,
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

  const stopAutoScroll = () => {
    isAutoScrollPlaying.value = false;

    if (animationFrameId != null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    previousFrameTime = null;
    autoScrollPosition = null;
  };

  const autoScrollStep = (timestamp: number) => {
    if (!isAutoScrollPlaying.value) {
      return;
    }

    if (previousFrameTime == null) {
      previousFrameTime = timestamp;
    }

    const elapsedSeconds = (timestamp - previousFrameTime) / 1000;
    previousFrameTime = timestamp;

    if (autoScrollPosition == null) {
      autoScrollPosition = getCurrentScrollTop();
    }

    const maxTop = getMaxScrollTop();
    const nextTop = Math.min(autoScrollPosition + autoScrollSpeed.value * elapsedSeconds, maxTop);
    autoScrollPosition = nextTop;

    scrollToTop(nextTop, 'auto');

    if (nextTop >= maxTop - 1) {
      stopAutoScroll();
      return;
    }

    animationFrameId = requestAnimationFrame(autoScrollStep);
  };

  const startAutoScroll = () => {
    if (isAutoScrollPlaying.value) {
      return;
    }

    const sessionId = sessionStore.sessionDetails?.id;

    if (sessionId && song.value?.id) {
      updateActiveSongId(song.value?.id, sessionId);
    }

    isAutoScrollPlaying.value = true;
    previousFrameTime = null;
    autoScrollPosition = getCurrentScrollTop();
    animationFrameId = requestAnimationFrame(autoScrollStep);
  };

  const toggleAutoScroll = () => {
    if (isAutoScrollPlaying.value) {
      stopAutoScroll();
      return;
    }

    startAutoScroll();
  };

  const scrollBackAndSlowDown = () => {
    autoScrollSpeed.value = Math.max(
      AUTO_SCROLL_MIN_SPEED,
      autoScrollSpeed.value - AUTO_SCROLL_SPEED_STEP
    );

    if (isAutoScrollPlaying.value) {
      scrollByDistance(-AUTO_SCROLL_SCROLL_STEP, 'smooth');
    }
  };

  const scrollForwardAndSpeedUp = () => {
    autoScrollSpeed.value = Math.min(
      AUTO_SCROLL_MAX_SPEED,
      autoScrollSpeed.value + AUTO_SCROLL_SPEED_STEP
    );

    if (isAutoScrollPlaying.value) {
      scrollByDistance(AUTO_SCROLL_SCROLL_STEP, 'smooth');
    }
  };

  const openChordsDialog = () => {
    isChordsDialogOpen.value = true;
  };

  const handleViewportChange = () => {
    syncScrollMetrics();
  };

  onMounted(() => {
    window.addEventListener('scroll', handleViewportChange, { passive: true, capture: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.visualViewport?.addEventListener('resize', handleViewportChange);

    void nextTick(() => {
      syncScrollMetrics();
    });
  });

  watch(
    [song, sections],
    async () => {
      await nextTick();
      syncScrollMetrics();
    },
    { deep: true }
  );

  onBeforeUnmount(() => {
    stopAutoScroll();
    window.removeEventListener('scroll', handleViewportChange, true);
    window.removeEventListener('resize', handleViewportChange);
    window.visualViewport?.removeEventListener('resize', handleViewportChange);
  });
</script>

<template>
  <TopNavigation
    :page-title="song?.title ?? 'Píseň'"
    :page-subtitle="song?.artist"
    :fade-away="isAutoScrollPlaying"
  />

  <main
    ref="songPageRef"
    class="song-page"
  >
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
        <SongQuickInfo
          :capo="song.capo"
          :original-key="''"
          :transpose="transpose"
        />

        <article class="song-body">
          <template v-if="sections.length > 0">
            <section
              v-for="(section, index) in sections"
              :key="`${section.type}-${index}`"
              class="song-section"
              :style="{ '--section-accent': SECTIONS_DICTIONARY[section.type].color }"
            >
              <h2 class="song-section-title">{{ SECTIONS_DICTIONARY[section.type].label }}</h2>
              <ChordLayoutRenderer
                class="song-text"
                :text="section.text"
                :transpose="transpose"
              />
            </section>
          </template>
          <ChordLayoutRenderer
            v-else
            class="song-text"
            :text="songText"
            :transpose="transpose"
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

    <SongChordsDialog
      :open="isChordsDialogOpen"
      :chords="songChords"
      :transpose="transpose"
      @update:open="isChordsDialogOpen = $event"
      @update:transpose="transpose = $event"
    />

    <SongControls
      :is-playing="isAutoScrollPlaying"
      :auto-scroll-speed="autoScrollSpeed"
      :auto-scroll-eta-label="autoScrollEtaLabel"
      @toggle-play="toggleAutoScroll"
      @step-back="scrollBackAndSlowDown"
      @step-forward="scrollForwardAndSpeedUp"
      @open-chords="openChordsDialog"
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
    padding: var(--space-lg) var(--space-md)
      calc(var(--space-3xl) + 88px + env(safe-area-inset-bottom, 0px));
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
    --song-chord-font-size: var(--font-size-chords);
    --song-text-line-height: 4.25;
    --song-text-font-family: var(--font-chord);
    --song-text-font-size: var(--font-size-lyrics);
    --song-chord-inline-font-size: inherit;
    --song-chord-inline-font-family: var(--font-chord);
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
    padding: 0;
    padding-left: var(--space-md);
    border-left: 1px solid color-mix(in srgb, var(--section-accent) 45%, transparent);
    border-left-width: 4px;
  }

  .song-section:not(:last-child) {
    margin-bottom: var(--space-md);
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
