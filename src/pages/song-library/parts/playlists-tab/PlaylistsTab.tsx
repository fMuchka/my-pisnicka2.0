import { useMemo, useState } from 'react';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import LoadingSpinner from '../../../../components/_core/loading-spinner/LoadingSpinner';
import type { PlaylistSongRef } from '../../../../lib/playlist';
import type { Song } from '../../../../lib/song';
import { formatPlaylistResultCount, matchesPlaylistQuery } from '../../filter';
import type { PublicMode } from '../../types';
import { usePlaylists, type PlaylistWithSongs } from '../../usePlaylists';
import { AddSongsDrawer } from '../add-songs-drawer/AddSongsDrawer';
import { CreatePlaylistDrawer } from '../create-playlist-drawer/CreatePlaylistDrawer';
import { LibraryToolbar } from '../library-toolbar/LibraryToolbar';
import { PlaylistList } from '../playlist-list/PlaylistList';

type PlaylistsTabProps = {
  mode: PublicMode;
  /** Every song the playlists can point to. */
  songs: Song[];
};

export function PlaylistsTab({ mode, songs }: Readonly<PlaylistsTabProps>) {
  const { playlists, isLoading, error, canEdit, create, addSongs, removeSong } = usePlaylists(mode);

  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const songById = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs]);
  const visiblePlaylists = playlists.filter((playlist) => matchesPlaylistQuery(playlist, query));
  const addingTo = playlists.find((playlist) => playlist.id === addingToId);
  const isMine = mode === 'private';

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
        onAddSongs={(playlist) => setAddingToId(playlist.id)}
        onRemoveSong={(playlist, songRef) => void handleRemoveSong(playlist, songRef)}
      />
    );
  };

  return (
    <>
      <LibraryToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Hledat playlist"
        resultCount={isLoading ? '' : formatPlaylistResultCount(visiblePlaylists.length, query)}
        createLabel={isMine ? 'Vytvořit playlist' : undefined}
        onCreate={() => setIsCreateOpen(true)}
      />

      {removeError && <ErrorMessage message={removeError} />}

      {renderPlaylists()}

      {isCreateOpen && (
        <CreatePlaylistDrawer
          onCreate={create}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {addingTo && (
        <AddSongsDrawer
          playlistName={addingTo.name}
          songs={songs.filter(
            (song) => !addingTo.songRefs.some((songRef) => songRef.sourceSongId === song.id)
          )}
          onAdd={(songIds) => addSongs(addingTo.id, songIds)}
          onClose={() => setAddingToId(null)}
        />
      )}
    </>
  );
}
