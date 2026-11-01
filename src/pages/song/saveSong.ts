import { parseCapo } from './parts/song-editor/draft';
import type { SongDraft } from './parts/song-editor/types';
import {
  createSongCatalogEntry,
  fetchSongCatalogEntryBySourceSongId,
  resolveSongCategoryIds,
  updateSongCatalogEntry,
  type CreateSongInput,
  type Song,
} from '../../lib/song';
import { extractUniqueChords } from '../../lib/songTextEditor/chords';
import { useSongStore } from '../../stores/song';

/**
 * Creates the song (no `songId`) or updates it, then mirrors it into the public song catalog.
 * The tags become the catalog entry's categories, creating any that don't exist yet. When the
 * draft's tags are unknown (null), an existing entry keeps the categories it has.
 */
export async function saveSong(draft: SongDraft, ownerId: string, songId?: string): Promise<Song> {
  const text = draft.text.trim();
  const capo = parseCapo(draft.capo);
  const input: CreateSongInput = {
    title: draft.title.trim(),
    artist: draft.artist.trim(),
    text: text || undefined,
    chords: extractUniqueChords(text),
    ...(capo !== undefined ? { capo } : {}),
    ...(draft.instrument ? { instrument: draft.instrument } : {}),
    ownerId,
  };

  const { createSong, updateSong } = useSongStore.getState();
  const saved = songId ? await updateSong(songId, input) : await createSong(input);

  const existingEntry = songId ? await fetchSongCatalogEntryBySourceSongId(saved.id) : null;
  const categories =
    draft.tags === null
      ? (existingEntry?.categories ?? [])
      : await resolveSongCategoryIds(draft.tags);

  const catalogInput = {
    sourceSongId: saved.id,
    title: saved.title,
    artist: saved.artist,
    chords: saved.chords,
    categories,
    ownerId: saved.ownerId,
  };

  if (existingEntry) {
    await updateSongCatalogEntry(existingEntry.id, catalogInput);
  } else {
    await createSongCatalogEntry(catalogInput);
  }

  return { ...saved, categories };
}
