<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { Search, X } from 'lucide-vue-next';
  import CreatePlaylistDialog from '../dialogs/create-playlist/CreatePlaylistDialog.vue';
  import SongListFlatView from './flat-view/SongListFlatView.vue';
  import SongListOptionsMenu from './SongListOptionsMenu.vue';
  import SongListPlaylistPanel from './SongListPlaylistPanel.vue';
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
  const { viewMode, sourceMode, searchQuery, selectedChordFilters, selectedCategoryFilters } =
    storeToRefs(store);

  const isOptionsMenuOpen = ref(false);

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

  const availableChords = computed(() => STATIC_CHORD_FILTER_LIST);
  const normalizeChord = (value: string): string => value.trim().toLocaleLowerCase('cs');
  const selectedChordLookup = computed(
    () => new Set(selectedChordFilters.value.map(normalizeChord))
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

  const {
    isPlaylistMode,
    isSessionGuestView,
    isCreatePlaylistDialogOpen,
    playlistScope,
    playlists,
    selectedPlaylist,
    selectedPlaylistId,
    selectedPlaylistSongs,
    availableSongsForPlaylist,
    playlistSongToAdd,
    isPlaylistLoading,
    isPlaylistSongLoading,
    isCreatingPlaylist,
    isAddingPlaylistSong,
    playlistError,
    canCreatePlaylist,
    canEditSelectedPlaylist,
    canAddSongToPlaylist,
    createNewPlaylist,
    addSongToSelectedPlaylist,
    removeSongFromSelectedPlaylist,
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

  const setSourceMode = (mode: 'global' | 'playlists') => {
    sourceMode.value = mode;
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

  const setViewMode = (nextViewMode: 'tree' | 'flat') => {
    viewMode.value = nextViewMode;
  };

  const handleRefresh = async () => {
    await refresh();
  };

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

      <SongListSourceSwitch
        :source-mode="sourceMode"
        @set-source-mode="setSourceMode"
      />

      <SongListOptionsMenu
        v-model:open="isOptionsMenuOpen"
        :view-mode="viewMode"
        :available-chords="availableChords"
        :song-categories="songCategories"
        :selected-chord-filters="selectedChordFilters"
        :selected-category-filters="selectedCategoryFilters"
        :selected-category-labels="selectedCategoryLabels"
        :is-refreshing="isRefreshing"
        @set-view-mode="setViewMode"
        @set-chord-filters="store.setChordFilters"
        @clear-chord-filters="clearChordFilters"
        @set-category-filters="store.setCategoryFilters"
        @clear-category-filters="clearCategoryFilters"
        @refresh="handleRefresh"
      />
    </header>

    <SongListPlaylistPanel
      v-if="isPlaylistMode"
      :is-session-guest-view="isSessionGuestView"
      :playlist-scope="playlistScope"
      :can-create-playlist="canCreatePlaylist"
      :playlist-error="playlistError"
      :is-playlist-loading="isPlaylistLoading"
      :playlists="playlists"
      :selected-playlist-id="selectedPlaylistId"
      :can-edit-selected-playlist="canEditSelectedPlaylist"
      :available-songs-for-playlist="availableSongsForPlaylist"
      :playlist-song-to-add="playlistSongToAdd"
      :can-add-song-to-playlist="canAddSongToPlaylist"
      :is-adding-playlist-song="isAddingPlaylistSong"
      :is-playlist-song-loading="isPlaylistSongLoading"
      :filtered-songs="filteredSongs"
      @set-playlist-scope="setPlaylistScope"
      @open-create-playlist-dialog="openCreatePlaylistDialog"
      @set-selected-playlist="setSelectedPlaylist"
      @update:playlist-song-to-add="playlistSongToAdd = $event"
      @add-song="addSongToSelectedPlaylist"
      @remove-song="removeSongFromSelectedPlaylist"
    />

    <CreatePlaylistDialog
      v-model:open="isCreatePlaylistDialogOpen"
      :is-creating="isCreatingPlaylist"
      :error="playlistError"
      @create="createNewPlaylist"
    />

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

  .song-list__empty {
    color: var(--text-secondary);
    font-style: italic;
  }

  @media (max-width: 560px) {
    .song-list {
      padding: var(--space-md);
    }

    .song-list__header {
      align-items: flex-start;
    }
  }
</style>
