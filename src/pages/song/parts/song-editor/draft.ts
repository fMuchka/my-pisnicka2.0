import type { Instrument } from '../../../../lib/chords/chords.database';
import type { Song } from '../../../../lib/song';
import type { SongDraft } from './types';

/** A new song: written for the user's preferred instrument, shared with everyone, no tags yet. */
export const emptyDraft = (instrument: Instrument): SongDraft => ({
  title: '',
  artist: '',
  capo: '',
  text: '',
  instrument,
  visibility: 'public',
  tags: [],
});

export const toDraft = (song: Song, tags: string[] | null): SongDraft => ({
  title: song.title,
  artist: song.artist,
  capo: song.capo != null ? String(song.capo) : '',
  text: song.text ?? '',
  instrument: song.instrument ?? '',
  // Songs saved before visibility existed are all public.
  visibility: song.visibility ?? 'public',
  tags,
});

/** Empty is fine (no capo); anything else must be a whole number from 0 up. */
export const isValidCapo = (capo: string) => {
  const trimmed = capo.trim();

  return trimmed === '' || /^\d+$/.test(trimmed);
};

export const parseCapo = (capo: string): number | undefined => {
  const trimmed = capo.trim();

  return trimmed === '' ? undefined : Number(trimmed);
};

export const isDraftValid = (draft: SongDraft) =>
  draft.title.trim().length > 0 && draft.artist.trim().length > 0 && isValidCapo(draft.capo);
