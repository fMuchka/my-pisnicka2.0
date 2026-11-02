import type { PlaylistWithSongs } from '../../hooks/usePlaylists';
import type { PlaylistSongRef } from '../../lib/playlist';
import type { Song } from '../../lib/song';

export type PlaylistEntry = { songRef: PlaylistSongRef; song: Song };

/** The playlist's songs in playlist order; refs to songs that are gone (or not loaded yet) are left out. */
export const playlistEntries = (
  playlist: PlaylistWithSongs,
  songById: ReadonlyMap<string, Song>
): PlaylistEntry[] =>
  playlist.songRefs.flatMap((songRef) => {
    const song = songById.get(songRef.sourceSongId);
    return song ? [{ songRef, song }] : [];
  });
