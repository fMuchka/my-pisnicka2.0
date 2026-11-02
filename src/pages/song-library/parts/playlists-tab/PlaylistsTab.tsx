import { useMemo, useState } from 'react';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import LoadingSpinner from '../../../../components/_core/loading-spinner/LoadingSpinner';
import { usePlaylists, type PlaylistWithSongs } from '../../../../hooks/usePlaylists';
import type { PlaylistSongRef } from '../../../../lib/playlist';
import type { Song } from '../../../../lib/song';
import { formatPlaylistResultCount, matchesPlaylistQuery } from '../../filter';
import { playlistEntries } from '../../playlistEntries';
import type { PublicMode } from '../../types';
import { AddSongsDrawer } from '../add-songs-drawer/AddSongsDrawer';
import { LibraryToolbar } from '../library-toolbar/LibraryToolbar';
import { PlaylistFormDrawer } from '../playlist-form-drawer/PlaylistFormDrawer';
import { PlaylistList, type PlaylistAction } from '../playlist-list/PlaylistList';
import { ReorderSongsDrawer } from '../reorder-songs-drawer/ReorderSongsDrawer';

type PlaylistsTabProps = {
  mode: PublicMode;
  /** Every song the playlists can point to. */
  songs: Song[];
};

/** Which drawer is open, and for which playlist. */
type OpenDrawer = { kind: 'create' } | { kind: PlaylistAction; playlistId: string } | null;

export function PlaylistsTab({ mode, songs }: Readonly<PlaylistsTabProps>) {
  const isMine = mode === 'private';
  const {
    playlists,
    isLoading,
    error,
    canEdit,
    create,
    update,
    remove,
    addSongs,
    removeSong,
    reorderSongs,
  } = usePlaylists(isMine ? 'mine' : 'public');

  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState<OpenDrawer>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const songById = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs]);
  const visiblePlaylists = playlists.filter((playlist) => matchesPlaylistQuery(playlist, query));
  const drawerPlaylist =
    drawer && 'playlistId' in drawer
      ? playlists.find((playlist) => playlist.id === drawer.playlistId)
      : undefined;
  const closeDrawer = () => setDrawer(null);

  const handleRemoveSong = async (playlist: PlaylistWithSongs, songRef: PlaylistSongRef) => {
    setRemoveError(null);

    try {
      await removeSong(playlist.id, songRef.id);
    } catch {
      setRemoveError('Píseň se nepodařilo odebrat z playlistu.');
    }
  };

  const emptyText = (() => {
    if (query.trim()) return 'Žádné playlisty neodpovídají hledání.';
    return isMine ? 'Zatím nemáš žádný playlist.' : 'Zatím tu nejsou žádné veřejné playlisty.';
  })();

  const renderPlaylists = () => {
    if (isLoading) return <LoadingSpinner label="Načítám playlisty…" />;
    if (error) return <ErrorMessage message={error} />;

    return (
      <PlaylistList
        playlists={visiblePlaylists}
        songById={songById}
        canEdit={canEdit}
        showVisibility={isMine}
        emptyText={emptyText}
        onAction={(playlist, kind) => setDrawer({ kind, playlistId: playlist.id })}
        onRemoveSong={(playlist, songRef) => void handleRemoveSong(playlist, songRef)}
      />
    );
  };

  const renderPlaylistDrawer = (playlist: PlaylistWithSongs, kind: PlaylistAction) => {
    switch (kind) {
      case 'add-songs':
        return (
          <AddSongsDrawer
            playlistName={playlist.name}
            songs={songs.filter(
              (song) => !playlist.songRefs.some((songRef) => songRef.sourceSongId === song.id)
            )}
            onAdd={(songIds) => addSongs(playlist.id, songIds)}
            onClose={closeDrawer}
          />
        );

      case 'reorder': {
        const entries = playlistEntries(playlist, songById);
        const shownIds = new Set(entries.map((entry) => entry.songRef.id));
        // Refs the drawer can't show keep their place at the end instead of being renumbered away.
        const hiddenIds = playlist.songRefs
          .filter((ref) => !shownIds.has(ref.id))
          .map((ref) => ref.id);

        return (
          <ReorderSongsDrawer
            playlistName={playlist.name}
            entries={entries}
            onSave={(orderedIds) => reorderSongs(playlist.id, [...orderedIds, ...hiddenIds])}
            onClose={closeDrawer}
          />
        );
      }

      case 'edit':
        return (
          <PlaylistFormDrawer
            playlist={playlist}
            onSubmit={(input) => update(playlist.id, input)}
            onDelete={() => remove(playlist.id)}
            onClose={closeDrawer}
          />
        );
    }
  };

  return (
    <>
      <LibraryToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Hledat playlist"
        resultCount={isLoading ? '' : formatPlaylistResultCount(visiblePlaylists.length, query)}
        createLabel={isMine ? 'Vytvořit playlist' : undefined}
        onCreate={() => setDrawer({ kind: 'create' })}
      />

      {removeError && <ErrorMessage message={removeError} />}

      {renderPlaylists()}

      {drawer?.kind === 'create' && (
        <PlaylistFormDrawer
          onSubmit={async (input) => {
            await create(input);
          }}
          onClose={closeDrawer}
        />
      )}

      {drawerPlaylist &&
        drawer &&
        drawer.kind !== 'create' &&
        renderPlaylistDrawer(drawerPlaylist, drawer.kind)}
    </>
  );
}
