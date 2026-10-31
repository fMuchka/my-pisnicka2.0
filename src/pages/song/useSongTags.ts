import { useEffect, useState } from 'react';
import { fetchSongTagLabels } from '../../lib/song';

type LoadedTags = { songId: string; tags: string[] | null };

/**
 * The tag labels of `songId`, loaded for the editor. `tags` is null while loading and when loading
 * failed (`isLoading` tells them apart). A null `songId` (a new song) has no tags.
 */
export function useSongTags(songId: string | null) {
  const [loaded, setLoaded] = useState<LoadedTags | null>(null);

  useEffect(() => {
    if (songId == null) return;

    let cancelled = false;

    fetchSongTagLabels(songId)
      .then((tags) => {
        if (!cancelled) setLoaded({ songId, tags });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ songId, tags: null });
      });

    return () => {
      cancelled = true;
      // Forget them, so the next time the editor opens it loads what was saved since.
      setLoaded(null);
    };
  }, [songId]);

  if (songId == null) return { isLoading: false, tags: [] };
  // Results for another song (or none yet) mean this one is still on its way.
  if (loaded?.songId !== songId) return { isLoading: true, tags: null };

  return { isLoading: false, tags: loaded.tags };
}
