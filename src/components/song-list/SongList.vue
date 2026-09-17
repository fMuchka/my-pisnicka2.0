<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { Toggle } from '@ark-ui/vue/toggle';
  import { useRouter } from 'vue-router';
  import { Search, X } from 'lucide-vue-next';
  import CreatePlaylistDialog from '../dialogs/create-playlist/CreatePlaylistDialog.vue';
  import SongListBulkActions from './SongListBulkActions.vue';
  import SongListFlatView from './flat-view/SongListFlatView.vue';
  import SongListPlaylistPanel from './SongListPlaylistPanel.vue';
  import SongListSongsModeSwitch from './SongListSongsModeSwitch.vue';
  import SongListSourceSwitch from './SongListSourceSwitch.vue';
  import SongListTreeView from './tree-view/SongListTreeView.vue';
  import { useSongListPlaylists } from '../../composables/useSongListPlaylists';
  import { useSongListData } from '../../composables/useSongListData';
  import { STATIC_CHORD_FILTER_LIST } from '../../lib/chords/chords';
  import Routes from '../../router/Routes';
  import type { Song } from '../../lib/song';
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

  const props = withDefaults(defineProps<Props>(), {
    externalSearch: undefined,
    sessionHostId: undefined,
  });
  const emit = defineEmits<Emits>();

  const router = useRouter();
  const { user } = useAuth();

  const { userSongs, songCategories, isRefreshing, refresh } = useSongListData();
  const store = songListStore();
  const {
    viewMode,
    sourceMode,
    songsMode,
    searchQuery,
    selectedChordFilters,
    selectedCategoryFilters,
  } = storeToRefs(store);

  const isGlobalFiltersDrawerOpen = ref(false);
  const hasSubmittedGlobalSearch = ref(false);
  const submittedGlobalSearchQuery = ref('');
  const chordFilterQuery = ref('');
  const globalPage = ref(1);

  watch(
    () => props.externalSearch,
    (value) => {
      if (value !== undefined) {
        searchQuery.value = value;
      }
    }
  );

  const sessionHostId = computed(() => props.sessionHostId?.trim() ?? '');
  const currentUserId = computed(() => user.value?.uid ?? '');

  const isSearchMode = computed(() => sourceMode.value === 'songs' && songsMode.value === 'search');
  const isMineMode = computed(() => sourceMode.value === 'songs' && songsMode.value === 'mine');
  const myOwnedSongs = computed(() =>
    userSongs.value.filter((song) => song.ownerId === currentUserId.value)
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
  const normalizedSubmittedGlobalSearch = computed(() =>
    submittedGlobalSearchQuery.value.trim().toLocaleLowerCase('cs')
  );

  const availableChords = computed(() => STATIC_CHORD_FILTER_LIST);
  const normalizeChord = (value: string): string => value.trim().toLocaleLowerCase('cs');
  const normalizedChordFilterQuery = computed(() => normalizeChord(chordFilterQuery.value));
  const selectedChordLookup = computed(
    () => new Set(selectedChordFilters.value.map(normalizeChord))
  );
  const selectedCategoryLookup = computed(() => new Set(selectedCategoryFilters.value));

  const hasActiveFilters = computed(() => {
    const query = isSearchMode.value
      ? normalizedSubmittedGlobalSearch.value
      : normalizedSearch.value;

    return (
      query.length > 0 ||
      selectedChordFilters.value.length > 0 ||
      selectedCategoryFilters.value.length > 0
    );
  });

  const categoryNameById = computed(
    () => new Map(songCategories.value.map((category) => [category.id, category.value]))
  );

  const selectedCategoryLabels = computed(() =>
    selectedCategoryFilters.value
      .map((categoryId) => categoryNameById.value.get(categoryId))
      .filter((categoryLabel): categoryLabel is string => categoryLabel !== undefined)
  );

  const activeFilterCount = computed(
    () => selectedChordFilters.value.length + selectedCategoryFilters.value.length
  );

  const hasSelectedFilters = computed(() => activeFilterCount.value > 0);

  const shouldShowSearchClear = computed(
    () =>
      searchQuery.value.length > 0 ||
      (props.externalSearch !== undefined && props.externalSearch.length > 0)
  );

  const canSubmitGlobalSearch = computed(
    () => normalizedSearch.value.length > 0 || hasSelectedFilters.value
  );
  const COMMON_CHORD_PRIORITY = ['C', 'D', 'E', 'G', 'Em', 'Am', 'A', 'H', 'F', 'Dm', 'Hm', 'Gm'];
  const MAX_VISIBLE_CHORDS_WITHOUT_SEARCH = 12;
  const MAX_VISIBLE_CHORDS_WITH_SEARCH = 160;

  const commonChordsAvailable = computed(() => {
    const availableByNormalized = new Map(
      availableChords.value.map((chord) => [normalizeChord(chord), chord])
    );

    return COMMON_CHORD_PRIORITY.map((chord) =>
      availableByNormalized.get(normalizeChord(chord))
    ).filter((chord): chord is string => chord !== undefined);
  });

  const filteredChordOptions = computed(() => {
    const selectedLookup = selectedChordLookup.value;
    const query = normalizedChordFilterQuery.value;

    if (query.length > 0) {
      return availableChords.value
        .filter((chord) => normalizeChord(chord).includes(query))
        .slice(0, MAX_VISIBLE_CHORDS_WITH_SEARCH);
    }

    const selectedChords = availableChords.value.filter((chord) =>
      selectedLookup.has(normalizeChord(chord))
    );

    const selectedChordNormalizedSet = new Set(
      selectedChords.map((chord) => normalizeChord(chord))
    );
    const prioritizedCommonChords = commonChordsAvailable.value.filter(
      (chord) => !selectedChordNormalizedSet.has(normalizeChord(chord))
    );

    if (selectedChords.length >= MAX_VISIBLE_CHORDS_WITHOUT_SEARCH) {
      return selectedChords;
    }

    const commonSlots = Math.max(0, MAX_VISIBLE_CHORDS_WITHOUT_SEARCH - selectedChords.length);
    const commonChords = prioritizedCommonChords.slice(0, commonSlots);
    const commonChordNormalizedSet = new Set(commonChords.map((chord) => normalizeChord(chord)));

    const remainingSlots = Math.max(0, MAX_VISIBLE_CHORDS_WITHOUT_SEARCH - selectedChords.length);
    const remainingChords = availableChords.value
      .filter((chord) => {
        const normalizedChord = normalizeChord(chord);

        return (
          !selectedLookup.has(normalizedChord) &&
          !commonChordNormalizedSet.has(normalizedChord) &&
          !selectedChordNormalizedSet.has(normalizedChord)
        );
      })
      .slice(0, Math.max(0, remainingSlots - commonChords.length));

    return [...selectedChords, ...commonChords, ...remainingChords];
  });

  const totalMatchingChordCount = computed(() => {
    const query = normalizedChordFilterQuery.value;

    if (query.length === 0) {
      return availableChords.value.length;
    }

    return availableChords.value.filter((chord) => normalizeChord(chord).includes(query)).length;
  });

  const hasHiddenChordResults = computed(
    () => totalMatchingChordCount.value > filteredChordOptions.value.length
  );

  const isGlobalFilterOnlySearch = computed(
    () =>
      isSearchMode.value &&
      hasSubmittedGlobalSearch.value &&
      normalizedSubmittedGlobalSearch.value.length === 0 &&
      hasSelectedFilters.value
  );

  const hasSubmittedGlobalCriteria = computed(
    () => normalizedSubmittedGlobalSearch.value.length > 0 || hasSelectedFilters.value
  );

  const {
    isPlaylistMode,
    isSessionGuestView,
    isCreatePlaylistDialogOpen,
    playlistScope,
    playlists,
    playlistSongCounts,
    selectedPlaylist,
    selectedPlaylistId,
    selectedPlaylistSongs,
    selectedGlobalSongIds,
    isPlaylistLoading,
    isPlaylistSongLoading,
    isCreatingPlaylist,
    isBulkUpdatingPlaylist,
    playlistError,
    canCreatePlaylist,
    canEditSelectedPlaylist,
    canAddSongToPlaylist,
    createNewPlaylist,
    addSongToSelectedPlaylist,
    removeSongFromSelectedPlaylist,
    toggleGlobalSongSelection,
    togglePlaylistSongSelection,
    clearGlobalSongSelection,
    clearPlaylistSongSelection,
    setPlaylistScope,
    setSelectedPlaylist,
    openCreatePlaylistDialog,
  } = useSongListPlaylists({
    sourceMode,
    sessionHostId,
    currentUserId,
    userSongs,
    sortSongs: byArtistThenTitle,
  });

  const filteredSongs = computed(() => {
    if (sourceMode.value === 'playlists') {
      return [];
    }

    if (
      isSearchMode.value &&
      (!hasSubmittedGlobalSearch.value || !hasSubmittedGlobalCriteria.value)
    ) {
      return [];
    }

    const sourceSongs = isMineMode.value ? myOwnedSongs.value : userSongs.value;
    const query = isSearchMode.value
      ? normalizedSubmittedGlobalSearch.value
      : normalizedSearch.value;
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

  const GLOBAL_PAGE_SIZE = 10;

  const globalTotalPages = computed(() => {
    if (!isGlobalFilterOnlySearch.value) {
      return 1;
    }

    return Math.max(1, Math.ceil(filteredSongs.value.length / GLOBAL_PAGE_SIZE));
  });

  const pagedSongs = computed(() => {
    if (!isGlobalFilterOnlySearch.value) {
      return filteredSongs.value;
    }

    const start = (globalPage.value - 1) * GLOBAL_PAGE_SIZE;

    return filteredSongs.value.slice(start, start + GLOBAL_PAGE_SIZE);
  });

  watch(filteredSongs, () => {
    if (!isGlobalFilterOnlySearch.value) {
      return;
    }

    if (globalPage.value > globalTotalPages.value) {
      globalPage.value = globalTotalPages.value;
    }
  });

  const setSourceMode = (mode: 'songs' | 'playlists') => {
    sourceMode.value = mode;
    globalPage.value = 1;

    if (mode !== 'songs' || songsMode.value !== 'search') {
      isGlobalFiltersDrawerOpen.value = false;
    }
  };

  const setSongsMode = (mode: 'mine' | 'search') => {
    songsMode.value = mode;
    globalPage.value = 1;

    if (mode !== 'search') {
      isGlobalFiltersDrawerOpen.value = false;
    }
  };

  const showPlaylistSelectionMode = computed(
    () => sourceMode.value === 'songs' && viewMode.value === 'tree' && canEditSelectedPlaylist.value
  );

  const selectedSongIdsForTree = computed(() =>
    showPlaylistSelectionMode.value ? selectedGlobalSongIds.value : []
  );

  const bulkActionLabel = computed(() =>
    selectedPlaylist.value
      ? `Přidat vybrané do ${selectedPlaylist.value.name}`
      : 'Přidat vybrané do playlistu'
  );

  const bulkActionSummary = computed(() =>
    selectedPlaylist.value ? `Písně pro playlist ${selectedPlaylist.value.name}` : 'Vybrané písně'
  );

  const handleTreeSongSelectionToggle = (song: Song) => {
    if (!showPlaylistSelectionMode.value) {
      return;
    }

    toggleGlobalSongSelection(song.id);
  };

  const handleBulkAction = async () => {
    await addSongToSelectedPlaylist();
  };

  const clearTreeSelection = () => {
    clearGlobalSongSelection();
  };

  const togglePlaylistExpansion = (playlistId: string) => {
    setSelectedPlaylist(selectedPlaylistId.value === playlistId ? null : playlistId);
  };

  const handleRemoveSongFromPlaylist = async (songId: string) => {
    clearPlaylistSongSelection();
    togglePlaylistSongSelection(songId);
    await removeSongFromSelectedPlaylist();
  };

  const emptyMessage = computed(() => {
    if (
      isSearchMode.value &&
      (!hasSubmittedGlobalSearch.value || !hasSubmittedGlobalCriteria.value)
    ) {
      return 'Zadej hledání a potvrď tlačítkem Hledat.';
    }

    if (isMineMode.value && myOwnedSongs.value.length === 0) {
      return 'Zatím jsi nevytvořil žádnou píseň.';
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

  const setViewMode = (nextViewMode: 'tree' | 'flat') => {
    viewMode.value = nextViewMode;
  };

  const clearSearch = (): void => {
    searchQuery.value = '';
    hasSubmittedGlobalSearch.value = false;
    submittedGlobalSearchQuery.value = '';
    globalPage.value = 1;
    emit('update:externalSearch', '');
  };

  const submitGlobalSearch = async () => {
    if (!isSearchMode.value || !canSubmitGlobalSearch.value) {
      return;
    }

    const isFilterOnlySubmit = normalizedSearch.value.length === 0 && hasSelectedFilters.value;

    hasSubmittedGlobalSearch.value = true;
    submittedGlobalSearchQuery.value = searchQuery.value;
    globalPage.value = 1;

    if (isFilterOnlySubmit) {
      viewMode.value = 'flat';
    }

    await refresh();
  };

  const changeGlobalPage = async (nextPage: number) => {
    if (!isGlobalFilterOnlySearch.value) {
      return;
    }

    const normalizedPage = Math.max(1, Math.min(nextPage, globalTotalPages.value));

    if (normalizedPage === globalPage.value) {
      return;
    }

    globalPage.value = normalizedPage;
    await refresh();
  };

  const openGlobalFiltersDrawer = () => {
    isGlobalFiltersDrawerOpen.value = true;
  };

  const closeGlobalFiltersDrawer = () => {
    isGlobalFiltersDrawerOpen.value = false;
  };

  const handleGlobalEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isGlobalFiltersDrawerOpen.value) {
      closeGlobalFiltersDrawer();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleGlobalEscape);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleGlobalEscape);
  });

  const toggleCategoryFilter = (categoryId: string) => {
    store.toggleCategoryFilter(categoryId);
  };

  const toggleChordFilter = (chord: string) => {
    store.toggleChordFilter(chord, normalizeChord);
  };

  const clearAllFilters = () => {
    clearCategoryFilters();
    clearChordFilters();
  };

  const handleSongClick = (song: Song) => {
    router.push({ path: Routes.Song.replace(':songId', song.id) });
  };
</script>

<template>
  <section
    class="song-list"
    :class="{ 'song-list--drawer-open': isGlobalFiltersDrawerOpen }"
  >
    <header class="song-list__header">
      <SongListSourceSwitch
        :source-mode="sourceMode"
        @set-source-mode="setSourceMode"
      />

      <SongListSongsModeSwitch
        v-if="sourceMode === 'songs'"
        :songs-mode="songsMode"
        @set-songs-mode="setSongsMode"
      />

      <div
        v-if="sourceMode === 'songs'"
        class="song-list__view-switch"
        role="group"
        aria-label="Režim zobrazení seznamu písní"
      >
        <button
          type="button"
          class="song-list__view-switch-button"
          :class="{ 'song-list__view-switch-button--active': viewMode === 'tree' }"
          @click="setViewMode('tree')"
        >
          Strom
        </button>
        <button
          type="button"
          class="song-list__view-switch-button"
          :class="{ 'song-list__view-switch-button--active': viewMode === 'flat' }"
          @click="setViewMode('flat')"
        >
          Plochý seznam
        </button>
      </div>
    </header>

    <SongListPlaylistPanel
      v-if="isPlaylistMode"
      :is-session-guest-view="isSessionGuestView"
      :playlist-scope="playlistScope"
      :can-create-playlist="canCreatePlaylist"
      :playlist-error="playlistError"
      :is-playlist-loading="isPlaylistLoading"
      :playlists="playlists"
      :playlist-song-counts="playlistSongCounts"
      :selected-playlist-id="selectedPlaylistId"
      :selected-playlist-songs="selectedPlaylistSongs"
      :can-edit-selected-playlist="canEditSelectedPlaylist"
      :is-playlist-song-loading="isPlaylistSongLoading"
      :is-updating-playlist="isBulkUpdatingPlaylist"
      @set-playlist-scope="setPlaylistScope"
      @open-create-playlist-dialog="openCreatePlaylistDialog"
      @toggle-playlist="togglePlaylistExpansion"
      @remove-song="handleRemoveSongFromPlaylist"
      @song-click="handleSongClick"
    />

    <CreatePlaylistDialog
      v-model:open="isCreatePlaylistDialogOpen"
      :is-creating="isCreatingPlaylist"
      :error="playlistError"
      @create="createNewPlaylist"
    />

    <template v-if="sourceMode === 'songs'">
      <div
        v-if="isSearchMode"
        class="song-list__global-toolbar"
      >
        <div class="song-list__search-wrapper song-list__search-wrapper--global">
          <Search
            class="song-list__search-icon"
            :size="16"
          />
          <input
            v-model="searchQuery"
            class="song-list__search-input song-list__search-input--global"
            type="search"
            placeholder="Hledat podle názvu nebo interpreta…"
            aria-label="Hledat písně podle názvu nebo interpreta"
            @keydown.enter.prevent="submitGlobalSearch"
          />
          <button
            v-if="shouldShowSearchClear"
            type="button"
            class="song-list__search-clear"
            aria-label="Vymazat hledání"
            @click="clearSearch"
          >
            <X :size="14" />
          </button>
        </div>

        <div class="song-list__global-toolbar-row">
          <div class="song-list__active-filter-chips">
            <span
              v-for="chord in selectedChordFilters"
              :key="`selected-chord-${chord}`"
              class="song-list__chip"
            >
              {{ chord }}
            </span>

            <span
              v-for="categoryLabel in selectedCategoryLabels"
              :key="`selected-category-${categoryLabel}`"
              class="song-list__chip"
            >
              {{ categoryLabel }}
            </span>

            <button
              v-if="hasSelectedFilters"
              type="button"
              class="song-list__chip song-list__chip--muted song-list__chip--button"
              @click="clearAllFilters"
            >
              Vyčistit filtry
            </button>
          </div>

          <div class="song-list__global-toolbar-actions">
            <button
              type="button"
              class="song-list__search-submit"
              :disabled="!canSubmitGlobalSearch || isRefreshing"
              @click="submitGlobalSearch"
            >
              Hledat
            </button>

            <button
              type="button"
              class="song-list__drawer-toggle"
              :aria-expanded="isGlobalFiltersDrawerOpen"
              aria-controls="song-list-global-filters"
              @click="openGlobalFiltersDrawer"
            >
              Filtry ({{ activeFilterCount }})
            </button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="song-list__search-wrapper"
      >
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
          v-if="shouldShowSearchClear"
          type="button"
          class="song-list__search-clear"
          aria-label="Vymazat hledání"
          @click="clearSearch"
        >
          <X :size="14" />
        </button>
      </div>

      <SongListBulkActions
        v-if="showPlaylistSelectionMode"
        :label="bulkActionSummary"
        :selected-count="selectedSongIdsForTree.length"
        :primary-action-label="bulkActionLabel"
        :primary-action-disabled="!canAddSongToPlaylist"
        :is-busy="isBulkUpdatingPlaylist"
        @primary-action="handleBulkAction"
        @clear-selection="clearTreeSelection"
      />

      <p
        v-if="filteredSongs.length === 0"
        class="song-list__empty"
      >
        {{ emptyMessage }}
      </p>

      <SongListFlatView
        v-if="pagedSongs.length > 0 && viewMode === 'flat'"
        :songs="pagedSongs"
        :on-song-click="handleSongClick"
        :is-interactive="canOpenSongs"
      />

      <SongListTreeView
        v-if="pagedSongs.length > 0 && viewMode !== 'flat'"
        :songs="pagedSongs"
        artists-label="Interpreti"
        :auto-expand-on-filter="normalizedSearch.length > 0"
        :on-song-click="handleSongClick"
        :is-interactive="canOpenSongs"
        :selection-mode="showPlaylistSelectionMode"
        :selected-song-ids="selectedSongIdsForTree"
        :on-toggle-song-selection="handleTreeSongSelectionToggle"
      />

      <nav
        v-if="isGlobalFilterOnlySearch && filteredSongs.length > 0 && globalTotalPages > 1"
        class="song-list__pagination"
        aria-label="Stránkování výsledků"
      >
        <button
          type="button"
          class="song-list__pagination-button"
          :disabled="globalPage <= 1"
          @click="changeGlobalPage(globalPage - 1)"
        >
          Předchozí
        </button>

        <p class="song-list__pagination-status">
          Stránka {{ globalPage }} z {{ globalTotalPages }}
        </p>

        <button
          type="button"
          class="song-list__pagination-button"
          :disabled="globalPage >= globalTotalPages"
          @click="changeGlobalPage(globalPage + 1)"
        >
          Další
        </button>
      </nav>

      <button
        v-if="isSearchMode && isGlobalFiltersDrawerOpen"
        type="button"
        class="song-list__drawer-backdrop"
        aria-label="Zavřít filtr písní"
        @click="closeGlobalFiltersDrawer"
      />

      <aside
        v-if="isSearchMode"
        id="song-list-global-filters"
        class="song-list__drawer"
        :class="{ 'song-list__drawer--open': isGlobalFiltersDrawerOpen }"
        :aria-hidden="!isGlobalFiltersDrawerOpen"
      >
        <header class="song-list__drawer-header">
          <h2 class="song-list__drawer-title">Filtry</h2>
          <button
            type="button"
            class="song-list__drawer-close"
            aria-label="Zavřít filtr písní"
            @click="closeGlobalFiltersDrawer"
          >
            ×
          </button>
        </header>

        <div class="song-list__drawer-content">
          <section class="song-list__drawer-section">
            <h3 class="song-list__drawer-section-title">Kategorie</h3>
            <p
              v-if="songCategories.length === 0"
              class="song-list__drawer-empty"
            >
              Kategorie nejsou dostupné.
            </p>
            <div
              v-else
              class="song-list__drawer-filter-grid"
            >
              <Toggle.Root
                v-for="category in songCategories"
                :key="category.id"
                class="song-list__drawer-toggle-option"
                :pressed="selectedCategoryLookup.has(category.id)"
                @pressed-change="toggleCategoryFilter(category.id)"
              >
                <span>{{ category.value }}</span>
              </Toggle.Root>
            </div>
          </section>

          <section class="song-list__drawer-section">
            <h3 class="song-list__drawer-section-title">Akordy</h3>
            <div class="song-list__drawer-search-row">
              <input
                v-model="chordFilterQuery"
                class="song-list__drawer-search-input"
                type="search"
                placeholder="Najít akord..."
                aria-label="Najít akord"
              />
              <button
                v-if="chordFilterQuery.length > 0"
                type="button"
                class="song-list__drawer-search-clear"
                @click="chordFilterQuery = ''"
              >
                Vymazat
              </button>
            </div>

            <p
              v-if="chordFilterQuery.length === 0"
              class="song-list__drawer-help"
            >
              Zobrazené jsou nejčastější akordy. Další najdeš přes hledání.
            </p>

            <div class="song-list__drawer-filter-grid song-list__drawer-filter-grid--compact">
              <Toggle.Root
                v-for="chord in filteredChordOptions"
                :key="chord"
                class="song-list__drawer-toggle-option"
                :pressed="selectedChordLookup.has(normalizeChord(chord))"
                @pressed-change="toggleChordFilter(chord)"
              >
                <span>{{ chord }}</span>
              </Toggle.Root>
            </div>

            <p
              v-if="hasHiddenChordResults"
              class="song-list__drawer-help"
            >
              Zobrazeno {{ filteredChordOptions.length }} z {{ totalMatchingChordCount }} akordů.
              Upřesni hledání.
            </p>

            <p
              v-if="chordFilterQuery.length > 0 && filteredChordOptions.length === 0"
              class="song-list__drawer-empty"
            >
              Žádný akord neodpovídá hledání.
            </p>
          </section>
        </div>

        <footer class="song-list__drawer-footer">
          <button
            type="button"
            class="song-list__drawer-action song-list__drawer-action--secondary"
            :disabled="!hasSelectedFilters"
            @click="clearAllFilters"
          >
            Vyčistit
          </button>
          <button
            type="button"
            class="song-list__drawer-action song-list__drawer-action--primary"
            @click="closeGlobalFiltersDrawer"
          >
            Hotovo
          </button>
        </footer>
      </aside>
    </template>
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

  .song-list__view-switch {
    display: inline-flex;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .song-list__view-switch-button {
    border: none;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 12px;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .song-list__view-switch-button--active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }

  .song-list__global-toolbar {
    position: sticky;
    top: var(--space-sm);
    z-index: 4;
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
    border-radius: var(--radius-md);
    background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary));
    box-shadow: var(--shadow-panel);
  }

  .song-list__global-toolbar-row {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }

  .song-list__active-filter-chips {
    display: inline-flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .song-list__global-toolbar-actions {
    display: inline-flex;
    gap: var(--space-xs);
  }

  .song-list__chip {
    display: inline-flex;
    align-items: center;
    border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--bg-tertiary));
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-primary));
    color: var(--text-primary);
    border-radius: 999px;
    font-size: 0.78rem;
    padding: 4px 10px;
  }

  .song-list__chip--muted {
    border-color: var(--bg-tertiary);
    background: var(--bg-primary);
    color: var(--text-secondary);
  }

  .song-list__chip--button {
    cursor: pointer;
  }

  .song-list__drawer-toggle {
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, var(--accent) 55%, var(--bg-tertiary));
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-primary));
    color: var(--text-primary);
    padding: 5px 12px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__search-submit {
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, var(--accent) 70%, var(--bg-tertiary));
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    padding: 5px 12px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__search-submit:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .song-list__search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .song-list__search-wrapper--global {
    width: 100%;
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

  .song-list__search-input--global {
    border: 2px solid color-mix(in srgb, var(--accent) 45%, var(--bg-tertiary));
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
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

  .song-list__empty {
    color: var(--text-secondary);
    font-style: italic;
  }

  .song-list__drawer-backdrop {
    position: fixed;
    inset: 0;
    border: none;
    background: var(--overlay-backdrop);
    z-index: 15;
  }

  .song-list__drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: min(400px, 100%);
    height: 100dvh;
    background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary));
    border-left: 1px solid var(--bg-tertiary);
    box-shadow: var(--shadow-panel);
    z-index: 16;
    transform: translateX(105%);
    transition: transform var(--transition-slow);
    display: grid;
    grid-template-rows: auto 1fr auto;
  }

  .song-list__drawer--open {
    transform: translateX(0);
  }

  .song-list__drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    border-bottom: 1px solid var(--bg-tertiary);
  }

  .song-list__drawer-title {
    margin: 0;
    font-size: 1rem;
  }

  .song-list__drawer-close {
    border: 1px solid var(--bg-tertiary);
    border-radius: 999px;
    background: var(--bg-primary);
    color: var(--text-primary);
    width: 32px;
    height: 32px;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }

  .song-list__drawer-content {
    padding: var(--space-md);
    overflow: auto;
    display: grid;
    gap: var(--space-md);
  }

  .song-list__drawer-section {
    display: grid;
    gap: var(--space-sm);
  }

  .song-list__drawer-section-title {
    margin: 0;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .song-list__drawer-empty {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .song-list__drawer-filter-grid {
    display: grid;
    gap: var(--space-xs);
  }

  .song-list__drawer-filter-grid--compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .song-list__drawer-toggle-option {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    padding: 6px 8px;
    background: color-mix(in srgb, var(--bg-secondary) 75%, var(--bg-primary));
    color: var(--text-primary);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .song-list__drawer-toggle-option[data-state='on'] {
    border-color: color-mix(in srgb, var(--accent) 62%, var(--bg-tertiary));
    background: color-mix(in srgb, var(--accent) 18%, var(--bg-primary));
  }

  .song-list__drawer-search-row {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
  }

  .song-list__drawer-search-input {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font: inherit;
  }

  .song-list__drawer-search-clear {
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-secondary);
    padding: 8px 10px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__drawer-help {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .song-list__drawer-footer {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    padding: var(--space-md);
    border-top: 1px solid var(--bg-tertiary);
  }

  .song-list__drawer-action {
    border-width: 1px;
    border-style: solid;
    border-color: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 7px 12px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__drawer-action:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .song-list__drawer-action--primary {
    border-color: color-mix(in srgb, var(--accent) 55%, var(--bg-tertiary));
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-primary));
  }

  .song-list__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .song-list__pagination-status {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .song-list__pagination-button {
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 6px 10px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__pagination-button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: 560px) {
    .song-list {
      padding: var(--space-md);
    }

    .song-list__header {
      align-items: flex-start;
    }

    .song-list__global-toolbar {
      top: 6px;
    }

    .song-list__drawer-filter-grid--compact {
      grid-template-columns: 1fr;
    }
  }
</style>
