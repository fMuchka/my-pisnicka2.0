import { useEffect, useEffectEvent, useMemo, useState } from 'react';
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
  sourceMode: 'songs' | 'playlists';
  sessionHostId: string;
  currentUserId: string;
  userSongs: Song[];
  sortSongs: (a: Song, b: Song) => number;
}

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];

export function useSongListPlaylists(params: UseSongListPlaylistsParams) {
  const { sourceMode, sessionHostId, currentUserId, userSongs, sortSongs } = params;

  const [isCreatePlaylistDialogOpen, setIsCreatePlaylistDialogOpen] = useState(false);
  const [chosenScope, setChosenScope] = useState<'mine' | 'public'>('mine');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistSongCounts, setPlaylistSongCounts] = useState<Record<string, number>>({});
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedPlaylistSongRefs, setSelectedPlaylistSongRefs] = useState<PlaylistSongRef[]>([]);
  const [checkedGlobalSongIds, setCheckedGlobalSongIds] = useState<string[]>([]);
  const [checkedPlaylistSongIds, setCheckedPlaylistSongIds] = useState<string[]>([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
  const [isPlaylistSongLoading, setIsPlaylistSongLoading] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isBulkUpdatingPlaylist, setIsBulkUpdatingPlaylist] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  const isPlaylistMode = sourceMode === 'playlists';
  const isSessionGuestView = sessionHostId.length > 0 && sessionHostId !== currentUserId;
  // Session guests only ever see the host's playlists.
  const playlistScope: PlaylistScope = isSessionGuestView ? 'host' : chosenScope;

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId]
  );

  const selectedPlaylistSongs = useMemo(() => {
    const globalSongById = new Map(userSongs.map((song) => [song.id, song]));

    return selectedPlaylistSongRefs
      .map((songRef) => globalSongById.get(songRef.sourceSongId))
      .filter((song): song is Song => song !== undefined);
  }, [selectedPlaylistSongRefs, userSongs]);

  const availableSongsForPlaylist = useMemo(() => {
    const usedSongIds = new Set(selectedPlaylistSongRefs.map((songRef) => songRef.sourceSongId));

    return userSongs.filter((song) => !usedSongIds.has(song.id)).sort(sortSongs);
  }, [selectedPlaylistSongRefs, userSongs, sortSongs]);

  // Checked songs that left their list (added, removed, deleted) no longer count as selected.
  const selectedGlobalSongIds = useMemo(() => {
    const availableIds = new Set(availableSongsForPlaylist.map((song) => song.id));
    return checkedGlobalSongIds.filter((songId) => availableIds.has(songId));
  }, [checkedGlobalSongIds, availableSongsForPlaylist]);

  const selectedPlaylistSongIds = useMemo(() => {
    const availableIds = new Set(selectedPlaylistSongs.map((song) => song.id));
    return checkedPlaylistSongIds.filter((songId) => availableIds.has(songId));
  }, [checkedPlaylistSongIds, selectedPlaylistSongs]);

  const canCreatePlaylist =
    !isSessionGuestView && currentUserId.length > 0 && playlistScope === 'mine';

  const canEditSelectedPlaylist =
    selectedPlaylist != null && selectedPlaylist.ownerId === currentUserId;

  const canAddSongToPlaylist =
    canEditSelectedPlaylist &&
    selectedPlaylistId !== null &&
    selectedGlobalSongIds.length > 0 &&
    !isBulkUpdatingPlaylist;

  const canRemoveSongsFromPlaylist =
    canEditSelectedPlaylist && selectedPlaylistSongIds.length > 0 && !isBulkUpdatingPlaylist;

  const loadPlaylistSongs = async (playlistId: string | null) => {
    if (!playlistId) {
      setSelectedPlaylistSongRefs([]);
      return;
    }

    setIsPlaylistSongLoading(true);

    try {
      const songRefs = await fetchPlaylistSongRefs(playlistId);
      setSelectedPlaylistSongRefs(songRefs);
      setPlaylistSongCounts((counts) => ({ ...counts, [playlistId]: songRefs.length }));
    } catch {
      setSelectedPlaylistSongRefs([]);
      setPlaylistError('Nepodařilo se načíst písně playlistu.');
    } finally {
      setIsPlaylistSongLoading(false);
    }
  };

  const selectPlaylist = (playlistId: string | null) => {
    setSelectedPlaylistId(playlistId);
    setCheckedGlobalSongIds([]);
    setCheckedPlaylistSongIds([]);
  };

  const fetchPlaylistsForScope = (): Promise<Playlist[]> => {
    if (isSessionGuestView) {
      return fetchPublicPlaylists().then((hostPublic) =>
        hostPublic.filter((playlist) => playlist.ownerId === sessionHostId)
      );
    }

    if (playlistScope === 'public') {
      return fetchPublicPlaylists(currentUserId || undefined);
    }

    return currentUserId ? fetchUserPlaylists(currentUserId) : Promise.resolve([]);
  };

  const loadPlaylists = async () => {
    if (!isPlaylistMode) {
      return;
    }

    setPlaylistError(null);
    setIsPlaylistLoading(true);

    try {
      const nextPlaylists = await fetchPlaylistsForScope();
      setPlaylists(nextPlaylists);

      const keptPlaylistId = nextPlaylists.some((playlist) => playlist.id === selectedPlaylistId)
        ? selectedPlaylistId
        : null;

      if (keptPlaylistId !== selectedPlaylistId) {
        selectPlaylist(keptPlaylistId);
      }

      const counts = await Promise.all(
        nextPlaylists.map(async (playlist) => {
          const songRefs = await fetchPlaylistSongRefs(playlist.id);
          return [playlist.id, songRefs.length] as const;
        })
      );
      setPlaylistSongCounts(Object.fromEntries(counts));

      await loadPlaylistSongs(keptPlaylistId);
    } catch {
      setPlaylists([]);
      setPlaylistSongCounts({});
      selectPlaylist(null);
      setSelectedPlaylistSongRefs([]);
      setPlaylistError('Nepodařilo se načíst playlisty.');
    } finally {
      setIsPlaylistLoading(false);
    }
  };

  const onPlaylistSourceChange = useEffectEvent(() => {
    void loadPlaylists();
  });

  useEffect(() => {
    // Fetching on source change is what this effect is for; the loading flag set up front is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onPlaylistSourceChange();
  }, [isPlaylistMode, playlistScope, sessionHostId, currentUserId]);

  const createNewPlaylist = async (input: PlaylistCreateInput) => {
    if (!canCreatePlaylist || isCreatingPlaylist) {
      return;
    }

    const name = input.name.trim();

    if (name.length === 0) {
      setPlaylistError('Název playlistu nesmí být prázdný.');
      return;
    }

    setIsCreatingPlaylist(true);
    setPlaylistError(null);

    try {
      await createPlaylist({ name, ownerId: currentUserId, visibility: input.visibility });

      setIsCreatePlaylistDialogOpen(false);
      await loadPlaylists();
    } catch {
      setPlaylistError('Playlist se nepodařilo vytvořit.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const addSongToSelectedPlaylist = async () => {
    if (!selectedPlaylistId || !canAddSongToPlaylist) {
      return;
    }

    setIsBulkUpdatingPlaylist(true);
    setPlaylistError(null);

    try {
      await Promise.all(
        selectedGlobalSongIds.map((songId) => addSongToPlaylist(selectedPlaylistId, songId))
      );
      setCheckedGlobalSongIds([]);
      await loadPlaylistSongs(selectedPlaylistId);
    } catch {
      setPlaylistError('Píseň se nepodařilo přidat do playlistu.');
    } finally {
      setIsBulkUpdatingPlaylist(false);
    }
  };

  const removeSongFromSelectedPlaylist = async () => {
    if (!selectedPlaylistId || !canRemoveSongsFromPlaylist) {
      return;
    }

    setPlaylistError(null);
    setIsBulkUpdatingPlaylist(true);

    try {
      const songRefIdsToRemove = selectedPlaylistSongRefs
        .filter((songRef) => selectedPlaylistSongIds.includes(songRef.sourceSongId))
        .map((songRef) => songRef.id);

      await Promise.all(
        songRefIdsToRemove.map((songRefId) => removeSongFromPlaylist(selectedPlaylistId, songRefId))
      );
      setCheckedPlaylistSongIds([]);
      await loadPlaylistSongs(selectedPlaylistId);
    } catch {
      setPlaylistError('Píseň se nepodařilo odebrat z playlistu.');
    } finally {
      setIsBulkUpdatingPlaylist(false);
    }
  };

  const setSelectedPlaylist = (playlistId: string | null) => {
    if (playlistId === selectedPlaylistId) return;

    selectPlaylist(playlistId);

    if (isPlaylistMode) {
      void loadPlaylistSongs(playlistId);
    }
  };

  return {
    isPlaylistMode,
    isSessionGuestView,
    isCreatePlaylistDialogOpen,
    setIsCreatePlaylistDialogOpen,
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
    toggleGlobalSongSelection: (songId: string) =>
      setCheckedGlobalSongIds(toggleId(selectedGlobalSongIds, songId)),
    togglePlaylistSongSelection: (songId: string) =>
      setCheckedPlaylistSongIds(toggleId(selectedPlaylistSongIds, songId)),
    clearGlobalSongSelection: () => setCheckedGlobalSongIds([]),
    clearPlaylistSongSelection: () => setCheckedPlaylistSongIds([]),
    setPlaylistScope: setChosenScope,
    setSelectedPlaylist,
    openCreatePlaylistDialog: () => {
      setPlaylistError(null);
      setIsCreatePlaylistDialogOpen(true);
    },
  };
}
