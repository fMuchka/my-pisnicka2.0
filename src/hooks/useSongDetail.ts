import { useEffect, useState } from 'react';
import type { Song } from '../lib/song';
import { useSongStore } from '../stores/song';

type LoadResult = {
  songId: string;
  song: Song | null;
  songError: string | null;
};

const loadSong = async (songId: string): Promise<Song | null> => {
  const { getSong, refreshSong } = useSongStore.getState();
  const cached = await getSong(songId);

  // The list view caches songs without their text, so those still need a full fetch.
  if (!cached || !cached.text?.trim()) {
    return refreshSong(songId);
  }

  return cached;
};

export function useSongDetail(songId: string | null) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const hasSongId = songId != null && songId.length > 0;

  useEffect(() => {
    if (!hasSongId) return;

    // Ignores a slower response for a song the user already navigated away from.
    let isCurrent = true;

    loadSong(songId)
      .then((song) => {
        if (isCurrent) setResult({ songId, song, songError: null });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání písně';
        setResult({ songId, song: null, songError: `Chyba při načítání písně. ${errorMessage}` });
      });

    return () => {
      isCurrent = false;
    };
  }, [songId, hasSongId]);

  if (!hasSongId) {
    return { song: null, songError: null, songLoading: false };
  }

  const isCurrentResult = result?.songId === songId;

  return {
    // The previous song stays visible while the next one loads.
    song: result?.song ?? null,
    songError: isCurrentResult ? result.songError : null,
    songLoading: !isCurrentResult,
  };
}
