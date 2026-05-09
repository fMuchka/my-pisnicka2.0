<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import Button from '../core/Button.vue';
  import { Combobox, useListCollection } from '@ark-ui/vue/combobox';
  import { useFilter } from '@ark-ui/vue/locale';
  import { Menu } from '@ark-ui/vue/menu';
  import { Search, X, RefreshCw, Settings, ChevronDown, Check } from 'lucide-vue-next';
  import SongListFlatView from './flat-view/SongListFlatView.vue';
  import SongListTreeView from './tree-view/SongListTreeView.vue';
  import { useSongListData } from '../../composables/useSongListData';
  import { STATIC_CHORD_FILTER_LIST } from '../../lib/chords/chords';
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
  const { viewMode, searchQuery, selectedChordFilters } = storeToRefs(store);
  const CHORD_VIRTUAL_ITEM_HEIGHT = 36;
  const CHORD_VIRTUAL_VIEWPORT_HEIGHT = 180;
  const CHORD_VIRTUAL_OVERSCAN = 6;

  type ChordComboboxItem = { label: string; value: string };

  type VirtualizedItem<T> = { index: number; item: T };

  function useVirtualizedComboboxList<T>(params: {
    items: () => readonly T[];
    scrollTop: () => number;
    itemHeight: number;
    viewportHeight: number;
    overscan?: number;
  }) {
    const overscan = params.overscan ?? 4;

    const total = computed(() => params.items().length);

    const visibleCount = computed(() =>
      Math.max(1, Math.ceil(params.viewportHeight / params.itemHeight) + overscan * 2)
    );

    const startIndex = computed(() => {
      const rawIndex = Math.floor(params.scrollTop() / params.itemHeight) - overscan;

      return Math.max(0, rawIndex);
    });

    const endIndex = computed(() => Math.min(total.value, startIndex.value + visibleCount.value));

    const items = computed<VirtualizedItem<T>[]>(() => {
      const source = params.items();
      const result: VirtualizedItem<T>[] = [];

      for (let index = startIndex.value; index < endIndex.value; index++) {
        const item = source[index];

        if (item !== undefined) {
          result.push({ index, item });
        }
      }

      return result;
    });

    const paddingTop = computed(() => startIndex.value * params.itemHeight);
    const paddingBottom = computed(() =>
      Math.max(0, (total.value - endIndex.value) * params.itemHeight)
    );

    return {
      total,
      visibleItems: items,
      paddingTop,
      paddingBottom,
    };
  }

  const isOptionsMenuOpen = ref(false);
  const chordScrollerRef = ref<HTMLDivElement | null>(null);
  const chordScrollTop = ref(0);
  const filters = useFilter({ sensitivity: 'base' });
  const {
    collection: chordCollection,
    filter: filterChordCollection,
    set: setChordCollection,
  } = useListCollection<ChordComboboxItem>({
    initialItems: [],
    filter: filters.value.contains,
  });

  const virtualizedChordItems = useVirtualizedComboboxList<ChordComboboxItem>({
    items: () => chordCollection.value.items,
    scrollTop: () => chordScrollTop.value,
    itemHeight: CHORD_VIRTUAL_ITEM_HEIGHT,
    viewportHeight: CHORD_VIRTUAL_VIEWPORT_HEIGHT,
    overscan: CHORD_VIRTUAL_OVERSCAN,
  });
  const virtualizedChordVisibleItems = computed(() => virtualizedChordItems.visibleItems.value);
  const virtualizedChordTotal = computed(() => virtualizedChordItems.total.value);
  const virtualizedChordPaddingTop = computed(() => virtualizedChordItems.paddingTop.value);
  const virtualizedChordPaddingBottom = computed(() => virtualizedChordItems.paddingBottom.value);

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

  const normalizeChord = (value: string): string => value.trim().toLocaleLowerCase('cs');

  const availableChords = computed(() => STATIC_CHORD_FILTER_LIST);

  watch(
    availableChords,
    (chords) => {
      const items = chords.map((chord) => ({ label: chord, value: chord }));
      setChordCollection(items);

      const availableLookup = new Set(chords.map((chord) => normalizeChord(chord)));
      const nextSelected = selectedChordFilters.value.filter((chord) =>
        availableLookup.has(normalizeChord(chord))
      );

      if (nextSelected.length !== selectedChordFilters.value.length) {
        store.setChordFilters(nextSelected);
      }
    },
    { immediate: true }
  );

  const selectedChordLookup = computed(
    () => new Set(selectedChordFilters.value.map((chord) => normalizeChord(chord)))
  );

  const hasActiveFilters = computed(
    () => normalizedSearch.value.length > 0 || selectedChordFilters.value.length > 0
  );

  const filteredSongs = computed(() => {
    const query = normalizedSearch.value;
    const selectedChords = selectedChordLookup.value;

    return [...userSongs.value]
      .filter((song) => {
        if (selectedChords.size > 0) {
          const songChords = new Set(song.chords?.map((chord) => normalizeChord(chord)) ?? []);
          const hasAllSelectedChords = [...selectedChords].every((chord) => songChords.has(chord));

          if (!hasAllSelectedChords) {
            return false;
          }
        }

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

  const clearChordFilters = () => {
    store.clearChordFilters();
  };

  const handleChordInputChange = (details: Combobox.InputValueChangeDetails) => {
    filterChordCollection(details.inputValue);
  };

  const handleChordValueChange = (details: Combobox.ValueChangeDetails<ChordComboboxItem>) => {
    store.setChordFilters(details.items.map((item) => item.value));
  };

  const handleChordListScroll = () => {
    chordScrollTop.value = chordScrollerRef.value?.scrollTop ?? 0;
  };

  const handleChordScrollToIndex: Combobox.RootProps<ChordComboboxItem>['scrollToIndexFn'] = (
    details
  ) => {
    const scroller = chordScrollerRef.value;

    if (!scroller) {
      return;
    }

    const top = details.index * CHORD_VIRTUAL_ITEM_HEIGHT;
    scroller.scrollTo({ top, behavior: 'auto' });
    chordScrollTop.value = scroller.scrollTop;
  };

  const setViewMode = (nextViewMode: 'tree' | 'flat') => {
    viewMode.value = nextViewMode;
  };

  const handleRefresh = async () => {
    await refresh();
  };

  watch(isOptionsMenuOpen, (isOpen) => {
    if (!isOpen) {
      filterChordCollection('');
      chordScrollTop.value = 0;
    }
  });

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

      <Menu.Root
        :open="isOptionsMenuOpen"
        :close-on-select="false"
        @update:open="isOptionsMenuOpen = $event"
      >
        <Menu.Trigger as-child>
          <Button
            type="button"
            class="song-list__options-trigger"
            aria-label="Možnosti seznamu písní"
            label="Možnosti"
            style-variation="Text"
            :icon="{ component: Settings, position: 'prepend' }"
          />
        </Menu.Trigger>

        <Menu.Positioner>
          <Menu.Content class="song-list-options-menu">
            <div class="song-list-options__section-title">Režim zobrazení</div>
            <div
              class="song-list-options__view-grid"
              role="group"
              aria-label="Režim zobrazení seznamu písní"
            >
              <button
                type="button"
                class="song-list-options__view-card"
                :class="{ 'song-list-options__view-card--active': viewMode === 'tree' }"
                @click="setViewMode('tree')"
              >
                Strom
              </button>
              <button
                type="button"
                class="song-list-options__view-card"
                :class="{ 'song-list-options__view-card--active': viewMode === 'flat' }"
                @click="setViewMode('flat')"
              >
                Plochý seznam
              </button>
            </div>

            <div class="song-list-options__divider" />

            <div class="song-list-options__section-title">Filtr podle akordů</div>

            <div
              v-if="selectedChordFilters.length > 0"
              class="song-list-options__selected-chords"
              aria-label="Vybrané akordy"
            >
              <span
                v-for="chord in selectedChordFilters"
                :key="`selected-${chord}`"
                class="song-list-options__selected-chip"
              >
                {{ chord }}
              </span>
            </div>
            <Combobox.Root
              multiple
              :close-on-select="false"
              :lazy-mount="true"
              :unmount-on-exit="true"
              :collection="chordCollection"
              :model-value="selectedChordFilters"
              :scroll-to-index-fn="handleChordScrollToIndex"
              @input-value-change="handleChordInputChange"
              @value-change="handleChordValueChange"
            >
              <Combobox.Control class="song-list-options__combobox-control">
                <Combobox.Input
                  class="song-list-options__combobox-input"
                  aria-label="Vybrat akordy"
                  placeholder="Vybrat akordy"
                />
                <Combobox.Trigger
                  class="song-list-options__combobox-trigger"
                  aria-label="Otevřít výběr akordů"
                >
                  <ChevronDown
                    :size="14"
                    class="song-list-options__chord-chevron"
                  />
                </Combobox.Trigger>
              </Combobox.Control>

              <Combobox.Positioner>
                <Combobox.Content class="song-list-options__combobox-content">
                  <Combobox.Empty class="song-list-options__empty">
                    Žádné akordy k dispozici.
                  </Combobox.Empty>
                  <div
                    ref="chordScrollerRef"
                    class="song-list-options__combobox-scroller"
                    @scroll="handleChordListScroll"
                  >
                    <div :style="{ height: `${virtualizedChordPaddingTop}px` }" />

                    <Combobox.Item
                      v-for="virtualItem in virtualizedChordVisibleItems"
                      :key="virtualItem.item.value"
                      :item="virtualItem.item"
                      :aria-setsize="virtualizedChordTotal"
                      :aria-posinset="virtualItem.index + 1"
                      class="song-list-options__chord-item"
                    >
                      <Combobox.ItemText>{{ virtualItem.item.label }}</Combobox.ItemText>
                      <Combobox.ItemIndicator>
                        <Check
                          :size="14"
                          class="song-list-options__chord-check"
                        />
                      </Combobox.ItemIndicator>
                    </Combobox.Item>

                    <div :style="{ height: `${virtualizedChordPaddingBottom}px` }" />
                  </div>
                </Combobox.Content>
              </Combobox.Positioner>
            </Combobox.Root>

            <button
              v-if="selectedChordFilters.length > 0"
              type="button"
              class="song-list-options__clear-chords"
              @click="clearChordFilters"
            >
              Vymazat výběr
            </button>

            <div class="song-list-options__divider" />

            <Button
              type="button"
              class="song-list-options__refresh"
              :disabled="isRefreshing"
              label="Načíst písně"
              color-variation="Secondary"
              style-variation="Text"
              :icon="{ component: RefreshCw, position: 'prepend' }"
              @click="handleRefresh"
            />
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
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
        hasActiveFilters
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

  .song-list__options-trigger {
    padding-inline: 10px;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--text-primary) 14%, transparent);
    color: var(--text-secondary);
  }

  .song-list__options-trigger:hover {
    color: var(--text-primary);
    background-color: color-mix(in srgb, var(--text-primary) 10%, transparent);
  }

  .song-list-options-menu {
    margin-top: var(--space-xs);
    min-width: 260px;
    max-width: min(360px, calc(100vw - 32px));
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--text-primary) 12%, transparent);
    padding: var(--space-sm);
    z-index: 20;
    display: grid;
    gap: var(--space-xs);
  }

  .song-list-options-menu[data-state='closed'],
  .song-list-options-menu[hidden] {
    display: none !important;
    pointer-events: none;
  }

  .song-list-options__title {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    margin: 0;
    padding: 0 var(--space-xs);
  }

  .song-list-options__section-title {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    margin: 0;
    padding: 0 var(--space-xs);
  }

  .song-list-options__view-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .song-list-options__view-card {
    min-height: 52px;
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      background-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .song-list-options__view-card:hover {
    border-color: color-mix(in srgb, var(--accent) 35%, var(--bg-tertiary));
    transform: translateY(-1px);
  }

  .song-list-options__view-card:focus-visible,
  .song-list-options__chord-trigger:focus-visible,
  .song-list-options__chord-item:focus-visible,
  .song-list-options__clear-chords:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .song-list-options__view-card--active {
    border-color: color-mix(in srgb, var(--accent) 60%, var(--bg-tertiary));
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 16%, var(--bg-secondary));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent) inset;
  }

  .song-list-options__divider {
    width: 100%;
    height: 1px;
    background: color-mix(in srgb, var(--text-primary) 8%, transparent);
    margin: var(--space-xs) 0;
  }

  .song-list-options__combobox-control {
    position: relative;
  }

  .song-list-options__combobox-input {
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    min-height: 36px;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 32px 0 var(--space-sm);
    font: inherit;
  }

  .song-list-options__combobox-input::placeholder {
    color: var(--text-secondary);
  }

  .song-list-options__combobox-input:focus-visible,
  .song-list-options__combobox-trigger:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .song-list-options__combobox-trigger {
    position: absolute;
    top: 50%;
    right: var(--space-xs);
    transform: translateY(-50%);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    cursor: pointer;
  }

  .song-list-options__combobox-trigger:hover {
    background: color-mix(in srgb, var(--text-primary) 7%, transparent);
    color: var(--text-primary);
  }

  .song-list-options__combobox-content {
    border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
    background: color-mix(in srgb, var(--bg-secondary) 80%, var(--bg-primary));
    border-radius: var(--radius-sm);
    min-width: var(--reference-width);
    padding: var(--space-xs);
    display: grid;
    gap: 4px;
    max-height: 180px;
    overflow: hidden;
    z-index: 30;
  }

  .song-list-options__combobox-scroller {
    max-height: 180px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .song-list-options__combobox-content[data-state='closed'],
  .song-list-options__combobox-content[hidden] {
    display: none !important;
    pointer-events: none;
  }

  .song-list-options__chord-item {
    width: 100%;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    padding: 6px var(--space-xs);
    font: inherit;
    font-size: 0.85rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-xs);
    text-align: left;
    cursor: pointer;
  }

  .song-list-options__chord-item:hover {
    background: color-mix(in srgb, var(--text-primary) 7%, transparent);
    color: var(--text-primary);
  }

  .song-list-options__chord-item[data-state='checked'] {
    color: var(--text-primary);
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }

  .song-list-options__chord-check {
    opacity: 0;
    color: var(--accent);
  }

  .song-list-options__chord-item[data-state='checked'] .song-list-options__chord-check {
    opacity: 1;
  }

  .song-list-options__clear-chords {
    border: none;
    background: transparent;
    color: var(--accent);
    font: inherit;
    font-size: 0.8rem;
    text-align: left;
    padding: 4px var(--space-xs);
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .song-list-options__clear-chords:hover {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  .song-list-options__selected-chords {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .song-list-options__selected-chip {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 18%, var(--bg-secondary));
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    color: var(--text-primary);
    font-size: 0.78rem;
    font-weight: 600;
    margin-bottom: var(--space-sm);
  }

  .song-list-options__empty {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  .song-list__empty {
    color: var(--text-secondary);
    font-style: italic;
  }

  .song-list-options__refresh {
    justify-content: flex-start;
    width: 100%;
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
      align-items: flex-start;
    }

    .song-list-options-menu {
      min-width: min(280px, calc(100vw - 32px));
    }

    .song-list-options__view-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
