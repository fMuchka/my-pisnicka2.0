import { computed, ref, watch, type Ref } from 'vue';
import {
  addSongToPlaylist,
  createPlaylist,
  fetchPlaylistSongRefs,
  fetchPublicPlaylists,
  fetchUserPlaylists,
  removeSongFromPlaylist,
  type Playlist,
  type PlaylistSongRef,
  type PlaylistVisibility,
} from '../lib/playlist';
import type { Song } from '../lib/song';

type PlaylistScope = 'mine' | 'public' | 'host';
type PlaylistCreateInput = { name: string; visibility: PlaylistVisibility };

interface UseSongListPlaylistsParams {
  sourceMode: Ref<'songs' | 'playlists'>;
  sessionHostId: Ref<string>;
  currentUserId: Ref<string>;
  userSongs: Ref<Song[]>;
  sortSongs: (a: Song, b: Song) => number;
}

export function useSongListPlaylists(params: UseSongListPlaylistsParams) {
  const isCreatePlaylistDialogOpen = ref(false);
  const playlistScope = ref<PlaylistScope>('mine');
  const playlists = ref<Playlist[]>([]);
  const playlistSongCounts = ref<Record<string, number>>({});
  const selectedPlaylistId = ref<string | null>(null);
  const selectedPlaylistSongRefs = ref<PlaylistSongRef[]>([]);
  const selectedGlobalSongIds = ref<string[]>([]);
  const selectedPlaylistSongIds = ref<string[]>([]);
  const isPlaylistLoading = ref(false);
  const isPlaylistSongLoading = ref(false);
  const isCreatingPlaylist = ref(false);
  const isBulkUpdatingPlaylist = ref(false);
  const playlistError = ref<string | null>(null);

  const isPlaylistMode = computed(() => params.sourceMode.value === 'playlists');
  const isSessionGuestView = computed(
    () =>
      params.sessionHostId.value.length > 0 &&
      params.sessionHostId.value !== params.currentUserId.value
  );

  watch(isSessionGuestView, (isGuest) => {
    if (isGuest) {
      playlistScope.value = 'host';
    } else if (playlistScope.value === 'host') {
      playlistScope.value = 'mine';
    }
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
    const globalSongById = new Map(params.userSongs.value.map((song) => [song.id, song]));

    return selectedPlaylistSongRefs.value
      .map((songRef) => globalSongById.get(songRef.sourceSongId))
      .filter((song): song is Song => song !== undefined);
  });

  const availableSongsForPlaylist = computed(() => {
    const usedSongIds = selectedPlaylistSongLookup.value;

    return [...params.userSongs.value]
      .filter((song) => !usedSongIds.has(song.id))
      .sort(params.sortSongs);
  });

  const canCreatePlaylist = computed(
    () =>
      !isSessionGuestView.value &&
      params.currentUserId.value.length > 0 &&
      playlistScope.value === 'mine'
  );

  const canEditSelectedPlaylist = computed(() => {
    if (selectedPlaylist.value == null) {
      return false;
    }

    return selectedPlaylist.value.ownerId === params.currentUserId.value;
  });

  const canAddSongToPlaylist = computed(
    () =>
      canEditSelectedPlaylist.value &&
      selectedPlaylistId.value !== null &&
      selectedGlobalSongIds.value.length > 0 &&
      !isBulkUpdatingPlaylist.value
  );

  const canRemoveSongsFromPlaylist = computed(
    () =>
      canEditSelectedPlaylist.value &&
      selectedPlaylistSongIds.value.length > 0 &&
      !isBulkUpdatingPlaylist.value
  );

  const loadPlaylistSongs = async () => {
    if (!selectedPlaylistId.value) {
      selectedPlaylistSongRefs.value = [];
      return;
    }

    isPlaylistSongLoading.value = true;

    try {
      selectedPlaylistSongRefs.value = await fetchPlaylistSongRefs(selectedPlaylistId.value);
      playlistSongCounts.value = {
        ...playlistSongCounts.value,
        [selectedPlaylistId.value]: selectedPlaylistSongRefs.value.length,
      };
    } catch {
      selectedPlaylistSongRefs.value = [];
      playlistError.value = 'Nepodařilo se načíst písně playlistu.';
    } finally {
      isPlaylistSongLoading.value = false;
    }
  };

  const loadPlaylistSongCounts = async () => {
    if (playlists.value.length === 0) {
      playlistSongCounts.value = {};
      return;
    }

    const counts = await Promise.all(
      playlists.value.map(async (playlist) => {
        const songRefs = await fetchPlaylistSongRefs(playlist.id);
        return [playlist.id, songRefs.length] as const;
      })
    );

    playlistSongCounts.value = Object.fromEntries(counts);
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
      selectedPlaylistId.value = null;
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
        playlists.value = hostPublic.filter(
          (playlist) => playlist.ownerId === params.sessionHostId.value
        );
      } else if (playlistScope.value === 'public') {
        playlists.value = await fetchPublicPlaylists(params.currentUserId.value || undefined);
      } else if (!params.currentUserId.value) {
        playlists.value = [];
      } else {
        playlists.value = await fetchUserPlaylists(params.currentUserId.value);
      }

      ensureSelectedPlaylist();
      await loadPlaylistSongCounts();
      await loadPlaylistSongs();
    } catch {
      playlists.value = [];
      playlistSongCounts.value = {};
      selectedPlaylistId.value = null;
      selectedPlaylistSongRefs.value = [];
      playlistError.value = 'Nepodařilo se načíst playlisty.';
    } finally {
      isPlaylistLoading.value = false;
    }
  };

  watch(
    [isPlaylistMode, playlistScope, params.sessionHostId, params.currentUserId],
    () => {
      void loadPlaylists();
    },
    { immediate: true }
  );

  watch(selectedPlaylistId, () => {
    selectedGlobalSongIds.value = [];
    selectedPlaylistSongIds.value = [];

    if (isPlaylistMode.value) {
      void loadPlaylistSongs();
    }
  });

  watch(availableSongsForPlaylist, (songs) => {
    const availableIds = new Set(songs.map((song) => song.id));
    selectedGlobalSongIds.value = selectedGlobalSongIds.value.filter((songId) =>
      availableIds.has(songId)
    );
  });

  watch(selectedPlaylistSongs, (songs) => {
    const availableIds = new Set(songs.map((song) => song.id));
    selectedPlaylistSongIds.value = selectedPlaylistSongIds.value.filter((songId) =>
      availableIds.has(songId)
    );
  });

  const createNewPlaylist = async (input: PlaylistCreateInput) => {
    if (!canCreatePlaylist.value || isCreatingPlaylist.value) {
      return;
    }

    const name = input.name.trim();

    if (name.length === 0) {
      playlistError.value = 'Název playlistu nesmí být prázdný.';
      return;
    }

    isCreatingPlaylist.value = true;
    playlistError.value = null;

    try {
      await createPlaylist({
        name,
        ownerId: params.currentUserId.value,
        visibility: input.visibility,
      });

      isCreatePlaylistDialogOpen.value = false;
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

    isBulkUpdatingPlaylist.value = true;
    playlistError.value = null;

    try {
      await Promise.all(
        selectedGlobalSongIds.value.map((songId) =>
          addSongToPlaylist(selectedPlaylistId.value!, songId)
        )
      );
      selectedGlobalSongIds.value = [];
      await loadPlaylistSongs();
    } catch {
      playlistError.value = 'Píseň se nepodařilo přidat do playlistu.';
    } finally {
      isBulkUpdatingPlaylist.value = false;
    }
  };

  const removeSongFromSelectedPlaylist = async () => {
    if (!selectedPlaylistId.value || !canRemoveSongsFromPlaylist.value) {
      return;
    }

    playlistError.value = null;
    isBulkUpdatingPlaylist.value = true;

    try {
      const songRefIdsToRemove = selectedPlaylistSongRefs.value
        .filter((songRef) => selectedPlaylistSongIds.value.includes(songRef.sourceSongId))
        .map((songRef) => songRef.id);

      await Promise.all(
        songRefIdsToRemove.map((songRefId) =>
          removeSongFromPlaylist(selectedPlaylistId.value!, songRefId)
        )
      );
      selectedPlaylistSongIds.value = [];
      await loadPlaylistSongs();
    } catch {
      playlistError.value = 'Píseň se nepodařilo odebrat z playlistu.';
    } finally {
      isBulkUpdatingPlaylist.value = false;
    }
  };

  const toggleGlobalSongSelection = (songId: string) => {
    if (selectedGlobalSongIds.value.includes(songId)) {
      selectedGlobalSongIds.value = selectedGlobalSongIds.value.filter((value) => value !== songId);
      return;
    }

    selectedGlobalSongIds.value = [...selectedGlobalSongIds.value, songId];
  };

  const togglePlaylistSongSelection = (songId: string) => {
    if (selectedPlaylistSongIds.value.includes(songId)) {
      selectedPlaylistSongIds.value = selectedPlaylistSongIds.value.filter(
        (value) => value !== songId
      );
      return;
    }

    selectedPlaylistSongIds.value = [...selectedPlaylistSongIds.value, songId];
  };

  const clearGlobalSongSelection = () => {
    selectedGlobalSongIds.value = [];
  };

  const clearPlaylistSongSelection = () => {
    selectedPlaylistSongIds.value = [];
  };

  const setPlaylistScope = (scope: 'mine' | 'public') => {
    playlistScope.value = scope;
  };

  const setSelectedPlaylist = (playlistId: string | null) => {
    selectedPlaylistId.value = playlistId;
  };

  const openCreatePlaylistDialog = () => {
    playlistError.value = null;
    isCreatePlaylistDialogOpen.value = true;
  };

  return {
    isPlaylistMode,
    isSessionGuestView,
    isCreatePlaylistDialogOpen,
    playlistScope,
    playlists,
    playlistSongCounts,
    selectedPlaylist,
    selectedPlaylistId,
    selectedPlaylistSongs,
    availableSongsForPlaylist,
    selectedGlobalSongIds,
    selectedPlaylistSongIds,
    isPlaylistLoading,
    isPlaylistSongLoading,
    isCreatingPlaylist,
    isBulkUpdatingPlaylist,
    playlistError,
    canCreatePlaylist,
    canEditSelectedPlaylist,
    canAddSongToPlaylist,
    canRemoveSongsFromPlaylist,
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
  };
}
