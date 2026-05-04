<script setup lang="ts">
  import { computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import Button from '../core/Button.vue';
  import { Search, X, RefreshCw } from 'lucide-vue-next';
  import { SegmentGroup } from '@ark-ui/vue/segment-group';
  import SongListFlatView from './flat-view/SongListFlatView.vue';
  import SongListTreeView from './tree-view/SongListTreeView.vue';
  import { useSongListData } from '../../composables/useSongListData';
  import Routes from '../../router/Routes';
  import type { Song } from '../../lib/song';
  import { songListStore } from '../../stores/songList';
  import { storeToRefs } from 'pinia';

  interface Props {
    externalSearch?: string;
  }

  interface Emits {
    (event: 'update:externalSearch', value: string): void;
  }

  const props = withDefaults(defineProps<Props>(), { externalSearch: undefined });
  const emit = defineEmits<Emits>();

  const router = useRouter();

  const { userSongs, isRefreshing, refresh } = useSongListData();
  const store = songListStore();
  const { viewMode, searchQuery } = storeToRefs(store);

  watch(
    () => props.externalSearch,
    (value) => {
      if (value !== undefined) {
        searchQuery.value = value;
      }
    }
  );

  const byArtistThenTitle = (a: Song, b: Song): number => {
    return (
      a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' }) ||
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
  };

  const songMatchesFieldQuery = (song: Song, field: string, value: string): boolean => {
    if (!value) {
      return false;
    }

    if (field === 'artist') {
      return song.artist.toLocaleLowerCase('cs').includes(value);
    }

    if (field === 'title') {
      return song.title.toLocaleLowerCase('cs').includes(value);
    }

    return false;
  };

  const songMatchesStructuredQuery = (song: Song, query: string): boolean => {
    const normalizedQuery = query.replace(/\s+\band\b\s+/g, '&&').replace(/\s+\bor\b\s+/g, '||');

    const hasStructuredField = /(?:^|&&|\|\|)\s*[a-z]+\s*:/.test(normalizedQuery);
    const hasStructuredOperator = normalizedQuery.includes('&&') || normalizedQuery.includes('||');

    if (!hasStructuredField && !hasStructuredOperator) {
      return false;
    }

    const orGroups = normalizedQuery
      .split('||')
      .map((group) => group.trim())
      .filter((group) => group.length > 0);

    if (orGroups.length === 0) {
      return false;
    }

    return orGroups.some((group) => {
      const andConditions = group
        .split('&&')
        .map((condition) => condition.trim())
        .filter((condition) => condition.length > 0);

      if (andConditions.length === 0) {
        return false;
      }

      return andConditions.every((condition) => {
        const delimiterIndex = condition.indexOf(':');

        if (delimiterIndex <= 0) {
          return false;
        }

        const field = condition.slice(0, delimiterIndex).trim();
        const value = condition.slice(delimiterIndex + 1).trim();

        return songMatchesFieldQuery(song, field, value);
      });
    });
  };

  const normalizedSearch = computed(() => searchQuery.value.trim().toLocaleLowerCase('cs'));

  const filteredSongs = computed(() => {
    const query = normalizedSearch.value;

    return [...userSongs.value]
      .filter((song) => {
        if (!query) {
          return true;
        }

        const matchesStructuredQuery = songMatchesStructuredQuery(song, query);

        if (matchesStructuredQuery) {
          return true;
        }

        return (
          song.artist.toLocaleLowerCase('cs').includes(query) ||
          song.title.toLocaleLowerCase('cs').includes(query)
        );
      })
      .sort(byArtistThenTitle);
  });

  const canOpenSongs = true;

  const clearSearch = (): void => {
    searchQuery.value = '';
    emit('update:externalSearch', '');
  };

  const handleSongClick = (song: Song) => {
    router.push({ path: Routes.Song.replace(':songId', song.id) });
  };
</script>

<template>
  <section class="song-list">
    <header class="song-list__header">
      <h1 class="song-list__title">Seznam písní</h1>

      <Button
        type="button"
        class="song-list__refresh"
        :disabled="isRefreshing"
        aria-label="Obnovit seznam písní"
        label="Načíst písně"
        :icon="{ component: RefreshCw, position: 'prepend' }"
        @click="refresh"
      />

      <SegmentGroup.Root
        v-model="viewMode"
        class="song-list__segment"
        aria-label="Rezim zobrazeni seznamu pisni"
      >
        <SegmentGroup.Indicator class="song-list__segment-indicator" />

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
      </SegmentGroup.Root>
    </header>

    <div class="song-list__search-wrapper">
      <Search
        class="song-list__search-icon"
        :size="16"
      />
      <input
        v-model="searchQuery"
        class="song-list__search-input"
        type="search"
        placeholder="Hledat podle názvu nebo interpreta…"
        aria-label="Hledat písně podle názvu nebo interpreta"
      />
      <button
        v-if="searchQuery.length > 0 || (externalSearch && externalSearch?.length > 0)"
        type="button"
        class="song-list__search-clear"
        aria-label="Vymazat hledání"
        @click="clearSearch"
      >
        <X :size="14" />
      </button>
    </div>

    <p
      v-if="filteredSongs.length === 0"
      class="song-list__empty"
    >
      {{
        normalizedSearch
          ? 'Žádné písně neodpovídají hledání.'
          : 'Zatím nejsou dostupné žádné písně.'
      }}
    </p>

    <SongListFlatView
      v-else-if="viewMode === 'flat'"
      :songs="filteredSongs"
      :on-song-click="handleSongClick"
      :is-interactive="canOpenSongs"
    />

    <SongListTreeView
      v-else
      :songs="filteredSongs"
      artists-label="Interpreti"
      :auto-expand-on-filter="normalizedSearch.length > 0"
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

  .song-list__search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .song-list__search-icon {
    position: absolute;
    left: 10px;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .song-list__search-input {
    width: 100%;
    padding: 8px 34px 8px 34px;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 18px;
    font-family: var(--font-body);
  }

  .song-list__search-input::-webkit-search-cancel-button,
  .song-list__search-input::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  .song-list__search-input::-ms-clear,
  .song-list__search-input::-ms-reveal {
    display: none;
    width: 0;
    height: 0;
  }

  .song-list__search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .song-list__search-clear {
    position: absolute;
    right: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 999px;
    background-color: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .song-list__search-clear:hover {
    color: var(--text-primary);
    background-color: color-mix(in srgb, var(--text-primary) 10%, transparent);
  }

  .song-list__search-clear:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    outline-offset: 1px;
  }

  .song-list__segment {
    display: inline-flex;
    position: relative;
    isolation: isolate;
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    padding: 2px;
    font-size: 20px;
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

  .song-list__refresh {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    border: 1px solid color-mix(in srgb, var(--text-primary) 15%, transparent);
    border-radius: var(--radius-sm);
    background-color: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .song-list__refresh:hover:not(:disabled) {
    color: var(--text-primary);
    background-color: color-mix(in srgb, var(--text-primary) 8%, transparent);
  }

  .song-list__refresh:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .song-list__refresh:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    outline-offset: 2px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .song-list__refresh-icon--spinning {
    animation: spin 0.8s linear infinite;
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
