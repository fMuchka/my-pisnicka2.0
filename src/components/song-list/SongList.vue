<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { SegmentGroup } from '@ark-ui/vue/segment-group';
  import SongListFlatView from './flat-view/SongListFlatView.vue';
  import SongListTreeView from './tree-view/SongListTreeView.vue';
  import { useSongListData } from '../../composables/useSongListData';
  import Routes from '../../router/Routes';
  import type { Song } from '../../lib/song';

  const router = useRouter();

  const { userSongs } = useSongListData();

  type ViewMode = 'flat' | 'tree';

  const viewMode = ref<ViewMode>('flat');

  const byArtistThenTitle = (a: Song, b: Song): number => {
    return (
      a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' }) ||
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
  };

  const sortedSongs = computed(() => {
    return [...userSongs.value].sort(byArtistThenTitle);
  });

  const canOpenSongs = true;

  const handleSongClick = (song: Song) => {
    router.push({ path: Routes.Song.replace(':songId', song.id) });
  };
</script>

<template>
  <section class="song-list">
    <header class="song-list__header">
      <h1 class="song-list__title">Seznam písní</h1>

      <SegmentGroup.Root
        v-model="viewMode"
        class="song-list__segment"
        aria-label="Rezim zobrazeni seznamu pisni"
      >
        <SegmentGroup.Indicator class="song-list__segment-indicator" />

        <SegmentGroup.Item
          value="flat"
          class="song-list__segment-item"
        >
          <SegmentGroup.ItemText class="song-list__segment-item-text">
            Plochý seznam
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemControl />
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>

        <SegmentGroup.Item
          value="tree"
          class="song-list__segment-item"
        >
          <SegmentGroup.ItemText class="song-list__segment-item-text">
            Strom
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemControl />
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      </SegmentGroup.Root>
    </header>

    <p
      v-if="sortedSongs.length === 0"
      class="song-list__empty"
    >
      Zatím nejsou dostupné žádné písně.
    </p>

    <SongListFlatView
      v-else-if="viewMode === 'flat'"
      :songs="sortedSongs"
      :on-song-click="handleSongClick"
      :is-interactive="canOpenSongs"
    />

    <SongListTreeView
      v-else
      :songs="sortedSongs"
      artists-label="Interpreti"
      :on-song-click="handleSongClick"
      :is-interactive="canOpenSongs"
    />
  </section>
</template>

<style scoped>
  .song-list {
    background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary));
    border: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    display: grid;
    gap: var(--space-md);
  }

  .song-list__header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: center;
    justify-content: space-between;
  }

  .song-list__title {
    font-size: clamp(1.35rem, 1.2rem + 1vw, 1.8rem);
    letter-spacing: 0.02em;
  }

  .song-list__segment {
    display: inline-flex;
    position: relative;
    isolation: isolate;
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    padding: 2px;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 10%, transparent);
  }

  .song-list__segment-indicator {
    position: absolute;
    top: var(--top);
    left: var(--left);
    width: var(--width);
    height: var(--height);
    border-radius: calc(var(--radius-sm) - 2px);
    background-color: var(--bg-primary);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--text-primary) 12%, transparent);
    transition-property: width, height, left, top;
    transition-duration: var(--transition-fast);
    transition-timing-function: ease-out;
  }

  .song-list__segment-item {
    z-index: 1;
    border-radius: calc(var(--radius-sm) - 2px);
    border: none;
    padding: var(--space-xs) var(--space-sm);
    color: var(--text-secondary);
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition:
      color var(--transition-fast),
      transform var(--transition-fast);
  }

  .song-list__segment-item:hover {
    color: var(--text-primary);
  }

  .song-list__segment-item[data-state='checked'] {
    color: var(--accent);
  }

  .song-list__segment-item[data-focus-visible] {
    outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    outline-offset: 2px;
  }

  .song-list__segment-item:active {
    transform: translateY(1px);
  }

  .song-list__segment-item-text {
    position: relative;
    z-index: 1;
  }

  .song-list__empty {
    color: var(--text-secondary);
    font-style: italic;
  }

  @media (max-width: 560px) {
    .song-list {
      padding: var(--space-md);
    }

    .song-list__header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
