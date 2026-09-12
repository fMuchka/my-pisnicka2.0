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
  import {
    addSongToPlaylist,
    createPlaylist,
    fetchPlaylistSongRefs,
    fetchPublicPlaylists,
    fetchUserPlaylists,
    removeSongFromPlaylist,
    type Playlist,
    type PlaylistVisibility,
  } from '../../lib/playlist';
  import { useAuth } from '../../composables/useAuth';
  import { songListStore } from '../../stores/songList';
  import { storeToRefs } from 'pinia';

  interface Props {
    externalSearch?: string;
    sessionHostId?: string;
  }

  interface Emits {
    (event: 'update:externalSearch', value: string): void;
  }

  const props = withDefaults(defineProps<Props>(), { externalSearch: undefined });
  const emit = defineEmits<Emits>();

  const router = useRouter();
  const { user } = useAuth();

  const { userSongs, songCategories, isRefreshing, refresh } = useSongListData();
  const store = songListStore();
  const { viewMode, sourceMode, searchQuery, selectedChordFilters, selectedCategoryFilters } =
    storeToRefs(store);
  const CHORD_VIRTUAL_ITEM_HEIGHT = 36;
  const CHORD_VIRTUAL_VIEWPORT_HEIGHT = 180;
  const CHORD_VIRTUAL_OVERSCAN = 6;

  type ChordComboboxItem = { label: string; value: string };
  type PlaylistScope = 'mine' | 'public' | 'host';

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
  const playlistScope = ref<PlaylistScope>('mine');
  const playlists = ref<Playlist[]>([]);
  const selectedPlaylistId = ref<string | null>(null);
  const selectedPlaylistSongRefs = ref<
    Array<{ id: string; sourceSongId: string; position: number }>
  >([]);
  const playlistNameInput = ref('');
  const playlistVisibility = ref<PlaylistVisibility>('private');
  const playlistSongToAdd = ref('');
  const isPlaylistLoading = ref(false);
  const isPlaylistSongLoading = ref(false);
  const isCreatingPlaylist = ref(false);
  const isAddingPlaylistSong = ref(false);
  const playlistError = ref<string | null>(null);
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
  const {
    collection: categoryCollection,
    filter: filterCategoryCollection,
    set: setCategoryCollection,
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

  const isPlaylistMode = computed(() => sourceMode.value === 'playlists');
  const sessionHostId = computed(() => props.sessionHostId?.trim() ?? '');
  const currentUserId = computed(() => user.value?.uid ?? '');
  const isSessionGuestView = computed(
    () => sessionHostId.value.length > 0 && sessionHostId.value !== currentUserId.value
  );

  watch(isSessionGuestView, (isGuest) => {
    if (isGuest) {
      playlistScope.value = 'host';
    } else if (playlistScope.value === 'host') {
      playlistScope.value = 'mine';
    }
  });

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
    () =>
      normalizedSearch.value.length > 0 ||
      selectedChordFilters.value.length > 0 ||
      selectedCategoryFilters.value.length > 0
  );

  const categoryNameById = computed(
    () => new Map(songCategories.value.map((category) => [category.id, category.value]))
  );

  const selectedCategoryLabels = computed(() =>
    selectedCategoryFilters.value
      .map((categoryId) => categoryNameById.value.get(categoryId))
      .filter((categoryLabel): categoryLabel is string => categoryLabel !== undefined)
  );

  watch(
    songCategories,
    (categories) => {
      const items = categories.map((category) => ({ label: category.value, value: category.id }));
      setCategoryCollection(items);

      const categoryIdLookup = new Set(categories.map((category) => category.id));
      const nextSelected = selectedCategoryFilters.value.filter((categoryId) =>
        categoryIdLookup.has(categoryId)
      );

      if (nextSelected.length !== selectedCategoryFilters.value.length) {
        store.setCategoryFilters(nextSelected);
      }
    },
    { immediate: true }
  );

  const filteredSongs = computed(() => {
    const sourceSongs =
      sourceMode.value === 'global' ? userSongs.value : selectedPlaylistSongs.value;
    const query = normalizedSearch.value;
    const selectedChords = selectedChordLookup.value;
    const selectedCategoryIds = new Set(selectedCategoryFilters.value);

    return [...sourceSongs]
      .filter((song) => {
        if (selectedCategoryIds.size > 0) {
          const songCategoryIds = new Set(song.categories ?? []);
          const hasAllSelectedCategories = [...selectedCategoryIds].every((categoryId) =>
            songCategoryIds.has(categoryId)
          );

          if (!hasAllSelectedCategories) {
            return false;
          }
        }

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

  const playlistsById = computed(
    () => new Map(playlists.value.map((playlist) => [playlist.id, playlist]))
  );

  const selectedPlaylist = computed(() => {
    if (selectedPlaylistId.value == null) {
      return null;
    }

    return playlistsById.value.get(selectedPlaylistId.value) ?? null;
  });

  const selectedPlaylistSongLookup = computed(
    () => new Set(selectedPlaylistSongRefs.value.map((songRef) => songRef.sourceSongId))
  );

  const selectedPlaylistSongs = computed(() => {
    const globalSongById = new Map(userSongs.value.map((song) => [song.id, song]));

    return selectedPlaylistSongRefs.value
      .map((songRef) => globalSongById.get(songRef.sourceSongId))
      .filter((song): song is Song => song !== undefined);
  });

  const availableSongsForPlaylist = computed(() => {
    const usedSongIds = selectedPlaylistSongLookup.value;

    return [...userSongs.value].filter((song) => !usedSongIds.has(song.id)).sort(byArtistThenTitle);
  });

  const canCreatePlaylist = computed(
    () =>
      !isSessionGuestView.value && currentUserId.value.length > 0 && playlistScope.value === 'mine'
  );

  const canEditSelectedPlaylist = computed(() => {
    if (selectedPlaylist.value == null) {
      return false;
    }

    return selectedPlaylist.value.ownerId === currentUserId.value;
  });

  const canAddSongToPlaylist = computed(
    () =>
      canEditSelectedPlaylist.value &&
      selectedPlaylistId.value !== null &&
      playlistSongToAdd.value.length > 0 &&
      !isAddingPlaylistSong.value
  );

  const loadPlaylistSongs = async () => {
    if (!selectedPlaylistId.value) {
      selectedPlaylistSongRefs.value = [];
      return;
    }

    isPlaylistSongLoading.value = true;

    try {
      selectedPlaylistSongRefs.value = await fetchPlaylistSongRefs(selectedPlaylistId.value);
    } catch {
      selectedPlaylistSongRefs.value = [];
      playlistError.value = 'Nepodařilo se načíst písně playlistu.';
    } finally {
      isPlaylistSongLoading.value = false;
    }
  };

  const ensureSelectedPlaylist = () => {
    if (playlists.value.length === 0) {
      selectedPlaylistId.value = null;
      selectedPlaylistSongRefs.value = [];
      return;
    }

    const hasSelected =
      selectedPlaylistId.value !== null &&
      playlists.value.some((playlist) => playlist.id === selectedPlaylistId.value);

    if (!hasSelected) {
      selectedPlaylistId.value = playlists.value[0]?.id ?? null;
    }
  };

  const loadPlaylists = async () => {
    if (!isPlaylistMode.value) {
      return;
    }

    playlistError.value = null;
    isPlaylistLoading.value = true;

    try {
      if (isSessionGuestView.value) {
        const hostPublic = await fetchPublicPlaylists();
        playlists.value = hostPublic.filter((playlist) => playlist.ownerId === sessionHostId.value);
      } else if (playlistScope.value === 'public') {
        playlists.value = await fetchPublicPlaylists(currentUserId.value || undefined);
      } else {
        if (!currentUserId.value) {
          playlists.value = [];
        } else {
          playlists.value = await fetchUserPlaylists(currentUserId.value);
        }
      }

      ensureSelectedPlaylist();
      await loadPlaylistSongs();
    } catch {
      playlists.value = [];
      selectedPlaylistId.value = null;
      selectedPlaylistSongRefs.value = [];
      playlistError.value = 'Nepodařilo se načíst playlisty.';
    } finally {
      isPlaylistLoading.value = false;
    }
  };

  watch(
    [isPlaylistMode, playlistScope, sessionHostId, currentUserId],
    () => {
      void loadPlaylists();
    },
    { immediate: true }
  );

  watch(selectedPlaylistId, () => {
    if (isPlaylistMode.value) {
      void loadPlaylistSongs();
    }
  });

  watch(availableSongsForPlaylist, (songs) => {
    if (songs.length === 0) {
      playlistSongToAdd.value = '';
      return;
    }

    if (!songs.some((song) => song.id === playlistSongToAdd.value)) {
      playlistSongToAdd.value = songs[0]?.id ?? '';
    }
  });

  const createNewPlaylist = async () => {
    if (!canCreatePlaylist.value || isCreatingPlaylist.value) {
      return;
    }

    const name = playlistNameInput.value.trim();

    if (name.length === 0) {
      playlistError.value = 'Název playlistu nesmí být prázdný.';
      return;
    }

    isCreatingPlaylist.value = true;
    playlistError.value = null;

    try {
      await createPlaylist({
        name,
        ownerId: currentUserId.value,
        visibility: playlistVisibility.value,
      });

      playlistNameInput.value = '';
      await loadPlaylists();
    } catch {
      playlistError.value = 'Playlist se nepodařilo vytvořit.';
    } finally {
      isCreatingPlaylist.value = false;
    }
  };

  const addSongToSelectedPlaylist = async () => {
    if (!selectedPlaylistId.value || !canAddSongToPlaylist.value) {
      return;
    }

    isAddingPlaylistSong.value = true;
    playlistError.value = null;

    try {
      await addSongToPlaylist(selectedPlaylistId.value, playlistSongToAdd.value);
      await loadPlaylistSongs();
    } catch {
      playlistError.value = 'Píseň se nepodařilo přidat do playlistu.';
    } finally {
      isAddingPlaylistSong.value = false;
    }
  };

  const removeSongFromSelectedPlaylist = async (sourceSongId: string) => {
    if (!selectedPlaylistId.value || !canEditSelectedPlaylist.value) {
      return;
    }

    const matchingSongRef = selectedPlaylistSongRefs.value.find(
      (songRef) => songRef.sourceSongId === sourceSongId
    );

    if (!matchingSongRef) {
      return;
    }

    playlistError.value = null;

    try {
      await removeSongFromPlaylist(selectedPlaylistId.value, matchingSongRef.id);
      await loadPlaylistSongs();
    } catch {
      playlistError.value = 'Píseň se nepodařilo odebrat z playlistu.';
    }
  };

  const setSourceMode = (mode: 'global' | 'playlists') => {
    sourceMode.value = mode;
  };

  const setPlaylistScope = (scope: 'mine' | 'public') => {
    playlistScope.value = scope;
  };

  const setSelectedPlaylist = (playlistId: string) => {
    selectedPlaylistId.value = playlistId;
  };

  const emptyMessage = computed(() => {
    if (sourceMode.value === 'playlists' && playlists.value.length === 0) {
      if (isSessionGuestView.value) {
        return 'Host zatím nemá žádný veřejný playlist.';
      }

      if (playlistScope.value === 'public') {
        return 'Zatím nejsou dostupné veřejné playlisty.';
      }

      return 'Zatím nemáš žádný playlist.';
    }

    if (sourceMode.value === 'playlists' && selectedPlaylist.value == null) {
      return 'Vyber playlist.';
    }

    return hasActiveFilters.value
      ? 'Žádné písně neodpovídají hledání.'
      : 'Zatím nejsou dostupné žádné písně.';
  });

  const canOpenSongs = true;

  const clearChordFilters = () => {
    store.clearChordFilters();
  };

  const clearCategoryFilters = () => {
    store.clearCategoryFilters();
  };

  const handleCategoryInputChange = (details: Combobox.InputValueChangeDetails) => {
    filterCategoryCollection(details.inputValue);
  };

  const handleCategoryValueChange = (details: Combobox.ValueChangeDetails<ChordComboboxItem>) => {
    store.setCategoryFilters(details.items.map((item) => item.value));
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
      filterCategoryCollection('');
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

      <div
        class="song-list__source-switch"
        role="group"
        aria-label="Zdroj písní"
      >
        <button
          type="button"
          class="song-list__source-button"
          :class="{ 'song-list__source-button--active': sourceMode === 'playlists' }"
          @click="setSourceMode('playlists')"
        >
          Playlisty
        </button>
        <button
          type="button"
          class="song-list__source-button"
          :class="{ 'song-list__source-button--active': sourceMode === 'global' }"
          @click="setSourceMode('global')"
        >
          Globální písně
        </button>
      </div>

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

            <div class="song-list-options__section-title">Filtr podle kategorií</div>

            <div
              v-if="selectedCategoryLabels.length > 0"
              class="song-list-options__selected-categories"
              aria-label="Vybrané kategorie"
            >
              <span
                v-for="categoryLabel in selectedCategoryLabels"
                :key="`selected-category-${categoryLabel}`"
                class="song-list-options__selected-chip"
              >
                {{ categoryLabel }}
              </span>
            </div>

            <Combobox.Root
              multiple
              :close-on-select="false"
              :lazy-mount="true"
              :collection="categoryCollection"
              :model-value="selectedCategoryFilters"
              @input-value-change="handleCategoryInputChange"
              @value-change="handleCategoryValueChange"
            >
              <Combobox.Control class="song-list-options__combobox-control">
                <Combobox.Input
                  class="song-list-options__combobox-input"
                  aria-label="Vybrat kategorie"
                  placeholder="Vybrat kategorie"
                />
                <Combobox.Trigger
                  class="song-list-options__combobox-trigger"
                  aria-label="Otevřít výběr kategorií"
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
                    Žádné kategorie k dispozici.
                  </Combobox.Empty>

                  <Combobox.Item
                    v-for="category in categoryCollection.items"
                    :key="category.value"
                    :item="category"
                    class="song-list-options__chord-item"
                  >
                    <Combobox.ItemText>{{ category.label }}</Combobox.ItemText>
                    <Combobox.ItemIndicator>
                      <Check
                        :size="14"
                        class="song-list-options__chord-check"
                      />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                </Combobox.Content>
              </Combobox.Positioner>
            </Combobox.Root>

            <button
              v-if="selectedCategoryFilters.length > 0"
              type="button"
              class="song-list-options__clear-categories"
              @click="clearCategoryFilters"
            >
              Vymazat výběr kategorií
            </button>

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

    <section
      v-if="isPlaylistMode"
      class="song-list__playlist-panel"
    >
      <p
        v-if="isSessionGuestView"
        class="song-list__playlist-note"
      >
        V relaci vidíš pouze veřejné playlisty hosta.
      </p>

      <div
        v-else
        class="song-list__playlist-scope"
        role="group"
        aria-label="Rozsah playlistů"
      >
        <button
          type="button"
          class="song-list__playlist-scope-btn"
          :class="{ 'song-list__playlist-scope-btn--active': playlistScope === 'mine' }"
          @click="setPlaylistScope('mine')"
        >
          Moje
        </button>
        <button
          type="button"
          class="song-list__playlist-scope-btn"
          :class="{ 'song-list__playlist-scope-btn--active': playlistScope === 'public' }"
          @click="setPlaylistScope('public')"
        >
          Veřejné
        </button>
      </div>

      <div
        v-if="canCreatePlaylist"
        class="song-list__playlist-create"
      >
        <input
          v-model="playlistNameInput"
          type="text"
          class="song-list__playlist-input"
          placeholder="Nový playlist"
          aria-label="Název nového playlistu"
        />
        <label class="song-list__playlist-visibility">
          <input
            v-model="playlistVisibility"
            type="checkbox"
            true-value="public"
            false-value="private"
          />
          Veřejný
        </label>
        <button
          type="button"
          class="song-list__playlist-create-btn"
          :disabled="isCreatingPlaylist"
          @click="createNewPlaylist"
        >
          {{ isCreatingPlaylist ? 'Vytvářím...' : 'Vytvořit' }}
        </button>
      </div>

      <div
        v-if="playlistError"
        class="song-list__playlist-error"
        role="alert"
      >
        {{ playlistError }}
      </div>

      <div
        v-if="isPlaylistLoading"
        class="song-list__playlist-note"
      >
        Načítám playlisty...
      </div>

      <div
        v-else-if="playlists.length > 0"
        class="song-list__playlist-list"
      >
        <button
          v-for="playlist in playlists"
          :key="playlist.id"
          type="button"
          class="song-list__playlist-item"
          :class="{ 'song-list__playlist-item--active': selectedPlaylistId === playlist.id }"
          @click="setSelectedPlaylist(playlist.id)"
        >
          <span>{{ playlist.name }}</span>
          <small>{{ playlist.visibility === 'public' ? 'veřejný' : 'soukromý' }}</small>
        </button>
      </div>

      <div
        v-if="canEditSelectedPlaylist && selectedPlaylistId"
        class="song-list__playlist-add"
      >
        <select
          v-model="playlistSongToAdd"
          class="song-list__playlist-select"
          aria-label="Přidat globální píseň do playlistu"
        >
          <option
            v-for="song in availableSongsForPlaylist"
            :key="song.id"
            :value="song.id"
          >
            {{ song.artist }} - {{ song.title }}
          </option>
        </select>
        <button
          type="button"
          class="song-list__playlist-add-btn"
          :disabled="!canAddSongToPlaylist"
          @click="addSongToSelectedPlaylist"
        >
          {{ isAddingPlaylistSong ? 'Přidávám...' : 'Přidat do playlistu' }}
        </button>
      </div>

      <div
        v-if="isPlaylistSongLoading"
        class="song-list__playlist-note"
      >
        Načítám písně playlistu...
      </div>
    </section>

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
      {{ emptyMessage }}
    </p>

    <ul
      v-else-if="sourceMode === 'playlists' && canEditSelectedPlaylist"
      class="song-list__playlist-song-actions"
    >
      <li
        v-for="song in filteredSongs"
        :key="`remove-${song.id}`"
        class="song-list__playlist-song-actions-item"
      >
        <button
          type="button"
          class="song-list__playlist-remove-btn"
          @click="removeSongFromSelectedPlaylist(song.id)"
        >
          Odebrat {{ song.artist }} - {{ song.title }}
        </button>
      </li>
    </ul>

    <SongListFlatView
      v-if="filteredSongs.length > 0 && viewMode === 'flat'"
      :songs="filteredSongs"
      :on-song-click="handleSongClick"
      :is-interactive="canOpenSongs"
    />

    <SongListTreeView
      v-if="filteredSongs.length > 0 && viewMode !== 'flat'"
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

  .song-list__source-switch {
    display: inline-flex;
    border-radius: var(--radius-sm);
    border: 1px solid var(--bg-tertiary);
    overflow: hidden;
  }

  .song-list__source-button {
    border: none;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 12px;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .song-list__source-button--active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }

  .song-list__playlist-panel {
    display: grid;
    gap: var(--space-sm);
    border: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--bg-secondary) 75%, var(--bg-primary));
    padding: var(--space-sm);
  }

  .song-list__playlist-note {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .song-list__playlist-error {
    color: var(--color-error-dark);
    background: var(--color-error-light);
    border-radius: var(--radius-sm);
    padding: 6px 8px;
    font-size: 0.85rem;
  }

  .song-list__playlist-scope {
    display: inline-flex;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .song-list__playlist-scope-btn {
    border: none;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 6px 10px;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .song-list__playlist-scope-btn--active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }

  .song-list__playlist-create {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-xs);
    align-items: center;
  }

  .song-list__playlist-input,
  .song-list__playlist-select {
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    min-height: 34px;
    padding: 0 8px;
    font: inherit;
  }

  .song-list__playlist-visibility {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .song-list__playlist-create-btn,
  .song-list__playlist-add-btn,
  .song-list__playlist-remove-btn {
    border: 1px solid color-mix(in srgb, var(--text-primary) 14%, transparent);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    min-height: 34px;
    padding: 0 10px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__playlist-list {
    display: grid;
    gap: 6px;
  }

  .song-list__playlist-item {
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    text-align: left;
    padding: 8px;
    font: inherit;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .song-list__playlist-item small {
    color: var(--text-secondary);
  }

  .song-list__playlist-item--active {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--bg-tertiary));
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
  }

  .song-list__playlist-add {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-xs);
  }

  .song-list__playlist-song-actions {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }

  .song-list__playlist-song-actions-item {
    display: flex;
  }

  .song-list__playlist-remove-btn {
    width: 100%;
    text-align: left;
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
  .song-list-options__clear-chords:focus-visible,
  .song-list-options__clear-categories:focus-visible {
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

  .song-list-options__clear-categories {
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

  .song-list-options__clear-chords:hover,
  .song-list-options__clear-categories:hover {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  .song-list-options__selected-chords {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .song-list-options__selected-categories {
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

    .song-list__playlist-create,
    .song-list__playlist-add {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
