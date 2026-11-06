import { useEffect, useState } from 'react';
import type { Song } from '../lib/song';
import { keepSongLoaded, useLoadedSongsStore } from '../stores/loadedSongs';

/** The whole song, text included, kept current: saves made anywhere show up on their own. */
export function useSongDetail(songId: string | null) {
  const hasSongId = songId != null && songId.length > 0;
  const loaded = useLoadedSongsStore((state) => (hasSongId ? state.songs[songId] : undefined));
  const [lastSong, setLastSong] = useState<Song | null>(null);

  if (loaded?.song && loaded.song !== lastSong) {
    setLastSong(loaded.song);
  }

  useEffect(() => {
    if (hasSongId) keepSongLoaded(songId);
  }, [songId, hasSongId]);

  if (!hasSongId) {
    return { song: null, songError: null, songLoading: false };
  }

  return {
    // The previous song stays visible while the next one loads.
    song: loaded ? loaded.song : lastSong,
    songError: loaded?.songError ?? null,
    songLoading: loaded === undefined,
  };
}
